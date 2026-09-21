"""Local compatibility reader for Unity's v1 managed-reference registry.

UnityPy's fast reader cannot consume the older Terminus sentinel. This patch
uses embedded schemas and requires byte-exact consumption; it never pads or
discards unknown bytes. It only changes the Python process, not game files.
"""
from UnityPy.helpers import TypeTreeHelper as helper
_reference_generator = None


def set_reference_generator(generator):
    global _reference_generator
    _reference_generator = generator


def fix_generated_string_arrays(node, changes):
    """A generated List<string> node is a vector, not a scalar string."""
    if (node.m_Type == 'string' and node.m_Children
            and node.m_Children[0].m_Type == 'Array'
            and node.m_Children[0].m_Children[-1].m_Type == 'string'):
        node.m_Type = 'vector'
        changes.append(node.m_Name)
    for child in node.m_Children:
        fix_generated_string_arrays(child, changes)


def install():
    original_get = helper.get_ref_type_node
    original_read = helper.read_value
    helper.read_typetree_boost = None

    def get_node(value, asset):
        typ = value['type']
        cls = typ['class'] if isinstance(typ, dict) else getattr(typ, 'class')
        if cls in ('Terminus', ''):
            return None
        try:
            return original_get(value, asset)
        except ValueError:
            if _reference_generator is None:
                raise
            ns = typ['ns'] if isinstance(typ, dict) else typ.ns
            asm = typ['asm'] if isinstance(typ, dict) else typ.asm
            assembly = asm if asm.endswith('.dll') else asm + '.dll'
            node = _reference_generator.get_nodes_up(assembly, ns + '.' + cls if ns else cls)
            if node is None:
                raise
            # The generator prepends a Unity object header even for plain
            # serializable managed-reference payload classes. Such payloads
            # cannot be UnityEngine.Object instances and have no object header.
            prefix = ['m_GameObject', 'm_Enabled', 'm_Script', 'm_Name']
            if [c.m_Name for c in node.m_Children[:4]] == prefix:
                node.m_Children = node.m_Children[4:]
            fix_generated_string_arrays(node, [])
            return node

    def read(node, reader, config):
        if node.m_Type != 'ManagedReferencesRegistry':
            return original_read(node, reader, config)
        start = reader.Position
        version = reader.read_int()
        if version != 1:
            reader.Position = start
            return original_read(node, reader, config)
        ref_node = next(child for child in node.m_Children if child.m_Type == 'ReferencedObject')
        records = []
        while len(records) < 100000:
            value = original_read(ref_node, reader, config)
            records.append(value)
            typ = value['type']
            cls = typ['class'] if isinstance(typ, dict) else getattr(typ, 'class')
            if cls == 'Terminus':
                if helper.metaflag_is_aligned(node.m_MetaFlag):
                    reader.align_stream()
                return {'version': version, 'records': records}
        raise ValueError('Managed reference registry did not terminate')

    helper.get_ref_type_node = get_node
    helper.read_value = read
