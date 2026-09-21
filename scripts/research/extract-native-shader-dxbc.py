from pathlib import Path
import UnityPy,struct,re,json
from UnityPy.helpers import CompressionHelper
from UnityPy.streams import EndianBinaryReader
from UnityPy.export.ShaderConverter import ShaderProgram
ROOT=Path(__file__).resolve().parents[2]
b=ROOT/'原文件/No Umbrellas Allowed - 1.0.5 Demo Windows/No Umbrellas Allowed_Data';env=UnityPy.load(str(b/'resources.assets'));out=ROOT/'reference/original-study/items/shaders';out.mkdir(parents=True,exist_ok=True)
# Opcode/operand encoding documented by Microsoft DirectXShaderCompiler:
# https://github.com/microsoft/DirectXShaderCompiler/blob/main/include/dxc/Support/d3d12TokenizedProgramFormat.hpp
ops=dict(enumerate(['ADD', 'AND', 'BREAK', 'BREAKC', 'CALL', 'CALLC', 'CASE', 'CONTINUE', 'CONTINUEC', 'CUT', 'DEFAULT', 'DERIV_RTX', 'DERIV_RTY', 'DISCARD', 'DIV', 'DP2', 'DP3', 'DP4', 'ELSE', 'EMIT', 'EMITTHENCUT', 'ENDIF', 'ENDLOOP', 'ENDSWITCH', 'EQ', 'EXP', 'FRC', 'FTOI', 'FTOU', 'GE', 'IADD', 'IF', 'IEQ', 'IGE', 'ILT', 'IMAD', 'IMAX', 'IMIN', 'IMUL', 'INE', 'INEG', 'ISHL', 'ISHR', 'ITOF', 'LABEL', 'LD', 'LD_MS', 'LOG', 'LOOP', 'LT', 'MAD', 'MIN', 'MAX', 'CUSTOMDATA', 'MOV', 'MOVC', 'MUL', 'NE', 'NOP', 'NOT', 'OR', 'RESINFO', 'RET', 'RETC', 'ROUND_NE', 'ROUND_NI', 'ROUND_PI', 'ROUND_Z', 'RSQ', 'SAMPLE', 'SAMPLE_C', 'SAMPLE_C_LZ', 'SAMPLE_L', 'SAMPLE_D', 'SAMPLE_B', 'SQRT', 'SWITCH', 'SINCOS', 'UDIV', 'ULT', 'UGE', 'UMUL', 'UMAD', 'UMAX', 'UMIN', 'USHR', 'UTOF', 'XOR', 'DCL_RESOURCE', 'DCL_CONSTANT_BUFFER', 'DCL_SAMPLER', 'DCL_INDEX_RANGE', 'DCL_GS_OUTPUT_PRIMITIVE_TOPOLOGY', 'DCL_GS_INPUT_PRIMITIVE', 'DCL_MAX_OUTPUT_VERTEX_COUNT', 'DCL_INPUT', 'DCL_INPUT_SGV', 'DCL_INPUT_SIV', 'DCL_INPUT_PS', 'DCL_INPUT_PS_SGV', 'DCL_INPUT_PS_SIV', 'DCL_OUTPUT', 'DCL_OUTPUT_SGV', 'DCL_OUTPUT_SIV', 'DCL_TEMPS', 'DCL_INDEXABLE_TEMP', 'DCL_GLOBAL_FLAGS', 'RESERVED0', 'LOD', 'GATHER4', 'SAMPLE_POS', 'SAMPLE_INFO', 'RESERVED1', 'HS_DECLS', 'HS_CONTROL_POINT_PHASE', 'HS_FORK_PHASE', 'HS_JOIN_PHASE', 'EMIT_STREAM', 'CUT_STREAM', 'EMITTHENCUT_STREAM', 'INTERFACE_CALL', 'BUFINFO', 'DERIV_RTX_COARSE', 'DERIV_RTX_FINE', 'DERIV_RTY_COARSE', 'DERIV_RTY_FINE', 'GATHER4_C', 'GATHER4_PO', 'GATHER4_PO_C', 'RCP', 'F32TOF16', 'F16TOF32', 'UADDC', 'USUBB', 'COUNTBITS', 'FIRSTBIT_HI', 'FIRSTBIT_LO', 'FIRSTBIT_SHI', 'UBFE', 'IBFE', 'BFI', 'BFREV', 'SWAPC', 'DCL_STREAM', 'DCL_FUNCTION_BODY', 'DCL_FUNCTION_TABLE', 'DCL_INTERFACE', 'DCL_INPUT_CONTROL_POINT_COUNT', 'DCL_OUTPUT_CONTROL_POINT_COUNT', 'DCL_TESS_DOMAIN', 'DCL_TESS_PARTITIONING', 'DCL_TESS_OUTPUT_PRIMITIVE', 'DCL_HS_MAX_TESSFACTOR', 'DCL_HS_FORK_PHASE_INSTANCE_COUNT', 'DCL_HS_JOIN_PHASE_INSTANCE_COUNT', 'DCL_THREAD_GROUP', 'DCL_UNORDERED_ACCESS_VIEW_TYPED', 'DCL_UNORDERED_ACCESS_VIEW_RAW', 'DCL_UNORDERED_ACCESS_VIEW_STRUCTURED', 'DCL_THREAD_GROUP_SHARED_MEMORY_RAW', 'DCL_THREAD_GROUP_SHARED_MEMORY_STRUCTURED', 'DCL_RESOURCE_RAW', 'DCL_RESOURCE_STRUCTURED', 'LD_UAV_TYPED', 'STORE_UAV_TYPED', 'LD_RAW', 'STORE_RAW', 'LD_STRUCTURED', 'STORE_STRUCTURED', 'ATOMIC_AND', 'ATOMIC_OR', 'ATOMIC_XOR', 'ATOMIC_CMP_STORE', 'ATOMIC_IADD', 'ATOMIC_IMAX', 'ATOMIC_IMIN', 'ATOMIC_UMAX', 'ATOMIC_UMIN', 'IMM_ATOMIC_ALLOC', 'IMM_ATOMIC_CONSUME', 'IMM_ATOMIC_IADD', 'IMM_ATOMIC_AND', 'IMM_ATOMIC_OR', 'IMM_ATOMIC_XOR', 'IMM_ATOMIC_EXCH', 'IMM_ATOMIC_CMP_EXCH', 'IMM_ATOMIC_IMAX', 'IMM_ATOMIC_IMIN', 'IMM_ATOMIC_UMAX', 'IMM_ATOMIC_UMIN', 'SYNC', 'DADD', 'DMAX', 'DMIN', 'DMUL', 'DEQ', 'DGE', 'DLT', 'DNE', 'DMOV', 'DMOVC', 'DTOF', 'FTOD', 'EVAL_SNAPPED', 'EVAL_SAMPLE_INDEX', 'EVAL_CENTROID', 'DCL_GS_INSTANCE_COUNT', 'ABORT', 'DEBUG_BREAK', 'RESERVED0', 'DDIV', 'DFMA', 'DRCP', 'MSAD', 'DTOI', 'DTOU', 'ITOD', 'UTOD', 'RESERVED0']))

for obj in env.objects:
 if obj.type.name!='Shader' or obj.path_id not in [1338,1340,1343,1344]:continue
 d=obj.read();blob=bytes(d.compressedBlob)
 for pi,plat in enumerate(d.platforms):
  at=d.offsets[pi][0];length=d.compressedLengths[pi][0];size=d.decompressedLengths[pi][0];raw=CompressionHelper.decompress_lz4(blob[at:at+length],size);program=ShaderProgram(EndianBinaryReader(raw,endian='<'),obj.version)
  for si,sub in enumerate(program.m_SubPrograms):
   buf=sub.m_ProgramCode;pos=buf.find(b'DXBC')
   if pos<0:continue
   buf=buf[pos:];cnt=struct.unpack_from('<I',buf,28)[0];offs=struct.unpack_from('<'+'I'*cnt,buf,32)
   for off in offs:
    if buf[off:off+4] not in [b'SHDR',b'SHEX']:continue
    length=struct.unpack_from('<I',buf,off+4)[0];words=list(struct.unpack_from('<'+'I'*(length//4),buf,off+8));stage=words[0]>>16
    if stage!=0:continue
    def operand(p):
     t=words[p];p+=1;typ=(t>>12)&255;mode=(t>>2)&3;ncomp=t&3;ext=t>>31;mod=0
     while ext:
      v=words[p];p+=1;ext=v>>31
      if v&63==1:mod=(v>>6)&255
     nd=(t>>20)&3;indices=[]
     for n in range(nd):
      modei=(t>>(22+n*3))&7
      if modei!=0:raise ValueError('complex index')
      indices.append(words[p]);p+=1
     if typ==4:
      num=1 if ncomp==1 else 4;vals=words[p:p+num];p+=num;label='('+','.join(format(struct.unpack('<f',struct.pack('<I',v))[0],'.8g') for v in vals)+')'
     else:
      label={0:'r',1:'v',2:'o',6:'s',7:'t',8:'cb'}.get(typ,'type'+str(typ))+''.join('['+str(i)+']' for i in indices)
      if ncomp==2:
       sw=''.join('xyzw'[i] for i in range(4) if t&(1<<(i+4))) if mode==0 else ''.join('xyzw'[(t>>(4+2*i))&3] for i in range(4)) if mode==1 else 'xyzw'[(t>>4)&3]
       label+='.'+sw
     if mod in [2,3]:label='abs('+label+')'
     if mod in [1,3]:label='-'+label
     return label,p
    p=2;lines=[]
    while p<len(words):
     t=words[p];op=t&2047;n=(t>>24)&127;nxt=p+n;name=ops.get(op,'OP'+str(op));p+=1
     if not n:raise ValueError('zero length')
     if name.startswith('DCL'):
      lines.append(name+' '+str(words[p:nxt]));p=nxt;continue
     ext=t>>31
     while ext:ext=words[p]>>31;p+=1
     args=[]
     try:
      while p<nxt:a,p=operand(p);args.append(a)
     except Exception as e:args.append('PARSE ERROR '+str(e))
     lines.append(name+('_sat' if t&(1<<13) else '')+' '+', '.join(args));p=nxt
    target=out/f'win-{obj.path_id}-{si}.dxbc.txt';target.write_text('\n'.join(lines))
   # Save bytecode to enable independent reproduction in other disassemblers.
   (out/f'win-{obj.path_id}-{si}.dxbc').write_bytes(buf)
 print('exported',obj.path_id)
