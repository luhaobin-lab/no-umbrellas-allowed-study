import {defineConfig} from 'vite';
export default defineConfig({build:{target:'es2022'},server:{host:'127.0.0.1',port:5175,watch:{ignored:['**/reference/**','**/原文件/**','**/artifacts/**','**/docs/original-study/**']}},optimizeDeps:{entries:['index.html']}});
