package main

import (
	"context"
	"flag"
	"log"
	"os"
	"strconv"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

func main() {
	// Define command-line flags
	localFilePath := flag.String("file", "", "Path to the local file to upload")
	bucketName := flag.String("bucket", "", "MinIO S3 bucket name")
	objectKey := flag.String("key", "", "Object key for the uploaded file in S3")
	flag.Parse()

	if *localFilePath == "" || *bucketName == "" || *objectKey == "" {
		log.Println("Usage: go run main.go -file <localFilePath> -bucket <bucketName> -key <objectKey>")
		flag.PrintDefaults()
		os.Exit(1)
	}

	// Get MinIO connection details from environment variables
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKeyID := os.Getenv("S3_ACCESS_KEY")
	secretAccessKey := os.Getenv("S3_SECRET_KEY")
	useSSLStr := os.Getenv("S3_USE_SSL")

	if endpoint == "" || accessKeyID == "" || secretAccessKey == "" {
		log.Fatalln("Error: S3 environment variables (S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY) must be set.")
	}

	useSSL := true // Default to true
	if useSSLStr != "" {
		var err error
		useSSL, err = strconv.ParseBool(useSSLStr)
		if err != nil {
			log.Fatalf("Error parsing MINIO_USE_SSL: %v. It should be true or false.", err)
		}
	}

	ctx := context.Background()

	// Initialize minio client object.
	minioClient, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKeyID, secretAccessKey, ""),
		Secure: useSSL,
	})
	if err != nil {
		log.Fatalln("Error initializing MinIO client:", err)
	}

	contentType := "application/octet-stream"

	// Upload the file with FPutObject
	info, err := minioClient.FPutObject(ctx, *bucketName, *objectKey, *localFilePath, minio.PutObjectOptions{ContentType: contentType})
	if err != nil {
		log.Fatalln("Error uploading file:", err)
	}

	log.Printf("Successfully uploaded %s to %s/%s (Size: %d bytes)\n", *localFilePath, *bucketName, *objectKey, info.Size)
}
