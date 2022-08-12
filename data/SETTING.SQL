/* 데이터베이스 한글 인코딩 설정하기 */
ALTER DATABASE LOVE_TEST DEFAULT CHARACTER SET utf8 collate utf8_general_ci;

/* 쿼리 파일 수행 */
SOURCE D:\study\Project_Love\data\LESN_LIST_INSERT.SQL
SOURCE D:\study\Project_Love\data\STUD_INFO_INSERT.SQL
SOURCE D:\study\Project_Love\data\NUMB_INFO_INSERT.SQL
SOURCE D:\study\Project_Love\data\LESN_INFO_INSERT.SQL

/* 에러 발생
ERROR 1366 (22007) at line 2 in file: 'D:\study\Project_Love\data\STUD_INFO_INSERT.SQL': Incorrect string value: '\xBC' for column `love_test`.`stud_info`.`STUD_NM` at row 1
*/
/* 외래키 제약조건 비활성화 */
SET FOREIGN_KEY_CHECKS = 0;
/* 테이블 인코딩 변경하기 */
alter table LESN_LIST convert to character set utf8 collate utf8_general_ci;
alter table STUD_INFO convert to character set utf8 collate utf8_general_ci;
alter table NUMB_INFO convert to character set utf8 collate utf8_general_ci;
alter table LESN_INFO convert to character set utf8 collate utf8_general_ci;
/* 외래키 제약조건 활성화 */
SET FOREIGN_KEY_CHECKS = 1;
