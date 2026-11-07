Site Ekleme Kaldırma

#Ekleme
sed -i 's/\r$//' scripts/carrier-ekle.sh
bash scripts/carrier-ekle.sh ornek.com 1

#Dogrulama
BASE=http://127.0.0.1:3001 HOST=m.ornek.com npm run bot-test
BASE=http://127.0.0.1:3001 HOST=ornek.com npm run dogrula

#Site Kaldir
node scripts/domain.mjs cikar m.ornek.com
node scripts/domain.mjs cikar ornek.com

#Dikey Degistirme
sed -i 's/\r$//' scripts/dikey-degistir.sh
bash scripts/dikey-degistir.sh canli-mac