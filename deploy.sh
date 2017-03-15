export NODE_ENV=production
npm run build
npm run minify
rsync -avz ../demo v@v:~/stoneth_bip_demo
