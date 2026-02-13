using Abp.Application.Services;
using Abp.Authorization;
using Elicom.Storage.Dto;
using System;
using System.Threading.Tasks;

namespace Elicom.Storage
{
    [AbpAllowAnonymous]
    public class StorageTestAppService : ElicomAppServiceBase
    {
        private readonly IBlobStorageService _blobStorageService;

        public StorageTestAppService(IBlobStorageService blobStorageService)
        {
            _blobStorageService = blobStorageService;
        }

        public async Task<string> UploadTestImage(UploadTestImageInput input)
        {
            Console.WriteLine("[StorageTest] UploadTestImage called");
            var fileName = $"test-{Guid.NewGuid()}.png";
            return await _blobStorageService.UploadImageAsync(input.Base64Image, fileName);
        }
    }
}
