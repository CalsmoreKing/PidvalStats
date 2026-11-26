-- 038 · Судді: фото + виправлення помилкового запису
-- ---------------------------------------------------------------------
-- 1) Ельче 0:5 Барселона (23.08) судив Alejandro Quintero González, а не
--    «Алехандро Гонсалес». Перейменовуємо запис (id зберігається, матч
--    лишається привʼязаним) і прибираємо фото футболіста.
-- 2) Решта суддів отримує фото з Wikimedia (стабільні thumb-URL).

begin;

update referees
set name = 'Алехандро Кінтеро Гонсалес', photo_url = null
where id = '12534bf4-6684-45da-aa21-7bd3e3aa2853';

update referees set photo_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/20191002_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Olympique_Lyonnais_by_Stepro_StP_0239.jpg/250px-20191002_Fu%C3%9Fball%2C_M%C3%A4nner%2C_UEFA_Champions_League%2C_RB_Leipzig_-_Olympique_Lyonnais_by_Stepro_StP_0239.jpg'
where name = 'Хосе Луїс Монтеро';
update referees set photo_url = 'https://upload.wikimedia.org/wikipedia/commons/9/98/Schiedsrichter_BSV-SVW_%28cropped%29_%28cropped%29.jpg'
where name = 'Свен Яблонскі';
update referees set photo_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/63/Mart%C3%ADnez_Munuera_2018.jpg/250px-Mart%C3%ADnez_Munuera_2018.jpg'
where name = 'Хуан Мартінес Мунʼєра';
update referees set photo_url = 'https://upload.wikimedia.org/wikipedia/commons/8/86/Ricardo-De-Burgos.jpg'
where name = 'Рікардо Де Бургос';
update referees set photo_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Foto_de_Alberola_Rojas_saliendo_del_campo_del_Alcorc%C3%B3n%2C_el_Municipal_de_Santo_Domingo_%28cropped%29.jpg/250px-Foto_de_Alberola_Rojas_saliendo_del_campo_del_Alcorc%C3%B3n%2C_el_Municipal_de_Santo_Domingo_%28cropped%29.jpg'
where name = 'Хавʼєр Альберола Рохас';
update referees set photo_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ea/Gil_Manzano.jpg/250px-Gil_Manzano.jpg'
where name = 'Хесус Хіль Мансано';
update referees set photo_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/eb/Marco_Guida_2020.jpg/250px-Marco_Guida_2020.jpg'
where name = 'Марко Гуїда';
update referees set photo_url = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6f/Qaraba%C4%9F_vs_Ajax_%2824.10.2024%29_%28Nick_Walsh%29.jpg/250px-Qaraba%C4%9F_vs_Ajax_%2824.10.2024%29_%28Nick_Walsh%29.jpg'
where name = 'Нік Волш';

commit;

select name, photo_url is not null as has_photo from referees order by name;
