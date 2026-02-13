using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading.Tasks;

namespace Elicom.Storage
{
    public class BlobStorageService : IBlobStorageService
    {
        private readonly IConfiguration _configuration;
        private const string ContainerName = "primeship-products";

        public BlobStorageService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<string> UploadImageAsync(string base64Image, string fileName)
        {
            Console.WriteLine($"[BlobStorage] Upload attempt: {fileName}");
            if (string.IsNullOrEmpty(base64Image))
            {
                Console.WriteLine("[BlobStorage] Error: Base64 string is null or empty");
                return null;
            }

            Console.WriteLine($"[BlobStorage] Base64 length: {base64Image.Length}");

            // Handle data:image/png;base64,... format
            if (base64Image.Contains(","))
            {
                base64Image = base64Image.Split(',')[1];
                Console.WriteLine("[BlobStorage] Trimmed Data URL prefix");
            }

            var bytes = Convert.FromBase64String(base64Image);
            Console.WriteLine($"[BlobStorage] Decoded bytes: {bytes.Length}");

            var connectionString = _configuration["AzureStorage:ConnectionString"];
            
            if (string.IsNullOrEmpty(connectionString))
            {
                throw new Exception("Azure Storage connection string is missing in configuration.");
            }

            var blobServiceClient = new BlobServiceClient(connectionString);
            var containerClient = blobServiceClient.GetBlobContainerClient(ContainerName);

            // Ensure container exists (Safety)
            await containerClient.CreateIfNotExistsAsync(PublicAccessType.Blob);

            var blobClient = containerClient.GetBlobClient(fileName);
            
            using (var stream = new MemoryStream(bytes))
            {
                await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = GetContentType(fileName) });
            }

            Console.WriteLine($"[BlobStorage] Successfully uploaded to: {blobClient.Uri}");
            return blobClient.Uri.ToString();
        }

        private string GetContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLower();
            return ext switch
            {
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                _ => "application/octet-stream"
            };
        }
    }
}
