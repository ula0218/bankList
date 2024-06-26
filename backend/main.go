package main

import (
	"bufio"
	"database/sql"
	"encoding/csv"
	"fmt"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

var db *sql.DB

func main(){
	err := godotenv.Load()
    if err != nil {
        log.Fatalf("Error loading .env file: %v", err)
    }
    initDB()
    defer db.Close()

	err = importCSV("data.csv")
	if err != nil {
		log.Fatalf("Error importing CSV: %v", err)
	}
}

func initDB(){
	dbHost := os.Getenv("DB_HOST")
    dbPort := os.Getenv("DB_PORT")
    dbUser := os.Getenv("DB_USER")
    dbPass := os.Getenv("DB_PASS")
    dbName := os.Getenv("DB_NAME")

	dataSourceName := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s", dbUser, dbPass, dbHost, dbPort, dbName)
	var err error
    db, err = sql.Open("mysql", dataSourceName)
    if err != nil {
        log.Fatalf("Error opening database connection: %v", err)
    }
    fmt.Println("DB結構已建立")
	err = db.Ping()
    if err != nil {
        log.Fatalf("Error connecting to database: %v", err)
    }
    fmt.Println("DB連線成功")
	ensureTableExists()
}

func ensureTableExists() {
    query := `
        CREATE TABLE IF NOT EXISTS banks (
            id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
            bank_code VARCHAR(50) NOT NULL,
            bank_name VARCHAR(100) NOT NULL,
            address VARCHAR(255),
            phone VARCHAR(50)
        )
    `

    _, err := db.Exec(query)
    if err != nil {
        log.Fatalf("Error creating table: %v", err)
    }

    fmt.Println("資料表建立成功")
}

func importCSV(filename string) error {
    // 打開CSV文件
    file, err := os.Open(filename)
    if err != nil {
        return fmt.Errorf("failed to open CSV file: %v", err)
    }
    defer file.Close()

    // 使用CSV讀取器讀取文件
    reader := csv.NewReader(bufio.NewReader(file))

    // 略過CSV文件的標題行
    _, err = reader.Read()
    if err != nil {
        return fmt.Errorf("failed to read CSV header: %v", err)
    }

    // 開始處理每一行數據
    stmt, err := db.Prepare("INSERT INTO banks (bank_code, bank_name, address, phone) VALUES (?, ?, ?, ?)")
    if err != nil {
        return fmt.Errorf("failed to prepare SQL statement: %v", err)
    }
    defer stmt.Close()

    // 遍歷CSV文件的每一行
    for {
        record, err := reader.Read()
        if err != nil {
            break
        }

        // 解析CSV行中的數據
        bank_code := record[1]
        bank_name := record[2]
        address := record[3]
        phone := record[4]

        // 執行SQL插入語句
        _, err = stmt.Exec(bank_code, bank_name, address, phone)
        if err != nil {
            return fmt.Errorf("failed to insert row: %v", err)
        }
    }

    fmt.Println("CSV數據成功導入到資料庫！")
    return nil
}