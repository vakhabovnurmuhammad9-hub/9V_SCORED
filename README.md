# 9-V SCORED

Local football statistics and lineup management starter.

## Ishga tushirish (Windows)

1. ZIP faylni papkaga chiqarib oling.
2. Node.js 18 yoki undan yangisini o'rnating: https://nodejs.org/
3. Papkani VS Code'da oching.
4. VS Code terminalini oching: Terminal → New Terminal.
5. Quyidagini yozing:

```bash
npm start
```

6. Brauzerda `http://localhost:3000` manzilini oching.

## Admin kirish

- Login: `admin@gmai.com`
- Parol: `12345678`

Admin panelida Players bo'limidan 16 tagacha futbolchi yarating. Har bir futbolchiga alohida login va parol belgilang.

## Muhim

Bu versiya lokal prototip: ma'lumotlar `data.json` faylida saqlanadi. Bir kompyuterda sinash va funksiyalarni ko'rish uchun mo'ljallangan. Internetga joylashdan oldin autentifikatsiyani kuchaytirish, HTTPS, xavfsiz parol xeshlash (Argon2/bcrypt), ma'lumotlar bazasi, zaxira nusxa va admin parolini almashtirish kerak. Hozirgi demo login tizimi production uchun mo'ljallanmagan.

`data.json` birinchi ishga tushganda avtomatik yaratiladi. Uni o'chirsangiz demo ma'lumotlar qayta tiklanadi.

## Maxsus taktika sxemasi
Lineup Builder ichida `O'zim tuzaman` ni tanlang va `2-1-1` kabi sxema yozing. Raqamlar darvozabondan tashqari himoya-yarim himoya-hujum qatorlaridagi futbolchilar sonini bildiradi. Masalan, `2-1-1` = 1 darvozabon + 2 himoyachi + 1 yarim himoyachi + 1 hujumchi. Jami maydondagi futbolchilar soni 16 tadan oshmasligi kerak.

## O'zim tuzaman — maxsus futbol sxemasi
`Lineup Builder` sahifasida `O'zim tuzaman` ni tanlang va uchta raqamni `himoyachilar-yarim himoyachilar-hujumchilar` tartibida kiriting. Masalan, `3-1-1` — 3 himoyachi, 1 yarim himoyachi, 1 hujumchi. Darvozabon formulaga kirmaydi va maydonda alohida bitta pozitsiya sifatida avtomatik qo'shiladi. `2-2-1` ham shu tartibda ishlaydi. Jami tarkib (darvozabon bilan) 16 futbolchidan oshmasligi kerak.

## Alohida jamoa sxemalari va saqlash
Lineup Builder'da 9-V SCORED va raqib uchun sxema alohida tanlanadi. Masalan, biz `3-1-1`, raqib `2-1-1` bo'lishi mumkin. Har ikkala sxemada ham darvozabon alohida avtomatik joy sifatida qo'shiladi. Admin yaratgan futbolchilar va saqlangan tarkiblar lokal `data.json` faylida saqlanadi; serverni yopib qayta ochganda o'chmaydi. Faylni yoki ma'lumotlarni o'zingiz o'chirsangizgina yo'qoladi. Bu lokal saqlash bo'lib, turli kompyuterlardan bir xil bazaga kirish uchun hosting va markaziy database (masalan Supabase) kerak.

## O'yin tugadi — baho, gol va assist
Lineup Builder'da tarkib tuzilgach `🏁 O'yin tugadi` tugmasini bosing:

- Har bir futbolchi ustiga bosib **baho (0–10)**, **gol** va **assist** kiritasiz.
- Baho futbolchi kartasining **yuqori burchagida** chiqadi (rangi bahoga qarab o'zgaradi).
- Gol urgan futbolchiga ⚽, assist bergan futbolchiga 👟 qo'shiladi (1 tadan ko'p bo'lsa takrorlanadi, 3 tadan oshsa `⚽×4` ko'rinishida).
- Jamoa hisobi (masalan `2 : 1`) gollar yig'indisidan avtomatik chiqadi.
- `✅ Natijani saqlash` bosilganda natija `Saved Lineups` da ko'rinadi, bazadagi futbolchilarning **o'yin, gol, assist** statistikasi va **o'rtacha bahosi** avtomatik yangilanadi (raqib jamoasiga bazadan qo'shilgan futbolchilar ham).
- Tarkibni o'chirsangiz, futbolchilar statistikasi o'zgarmaydi (Players bo'limidan qo'lda tahrirlash mumkin).

## Hisob (shot) va gol urganlarni tanlash
`🏁 O'yin tugadi` bosilgach, yuqorida ikkala jamoa uchun hisobni `−` / `+` bilan belgilaysiz. Keyin `⚽ Gol urganlarni tanlash` orqali kim necha gol urganini belgilaysiz (jami golchilar hisobdan oshmaydi; qolgani avtogol/noma'lum bo'lib qoladi). Baho va assist uchun futbolchi kartasini bosing.

## Avtomatik saqlash
Lineup Builder holati (tarkib, sxemalar, hisob, golchilar, baho/assist, "O'yin tugadi" rejimi) har o'zgarishda `data.json` ichiga avtomatik saqlanadi. Papka/brauzer/server yopilib ochilsa ham tiklanadi. Faqat `🗑 Tozalash` bosganingizda yoki natija saqlangach hisob/baholar tozalanadi (tarkib qoladi). Login sessiyasi ham 30 kun saqlanadi (`sessions.json`). `data.json` yozilganda zaxira nusxa `data.json.bak` ham yaratiladi.

**Yangilashda:** `data.json` va `sessions.json` ni o'chirmang/ustiga yozmang — faqat `server.js` va `public/` ni almashtiring.

## Telefon va kompyuter
Sayt avtomatik moslashadi: telefonda menyu pastda, maydonlar ustma-ust; kompyuterda chap menyu va ikki ustun. Alohida versiya kerak emas.

## Do'stlarga ochish (internetga joylash)
GitHub Pages ishlamaydi (bu Node server). Render.com / Railway / Fly.io kabi Node hosting kerak: Start command `npm start`, `PORT` avtomatik beriladi. Ma'lumot saqlanishi uchun doimiy disk (volume) ulang va `DATA_FILE=/data/data.json` muhit o'zgaruvchisini qo'ying. Joylashdan oldin admin parolini almashtiring.
