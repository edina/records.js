require('shelljs/global');

rm('dist/records.js')
cp('src/index.js', 'dist/records.js');
