using System.ComponentModel.DataAnnotations;

namespace Elicom.Storage.Dto
{
    public class UploadTestImageInput
    {
        [Required]
        public string Base64Image { get; set; }
    }
}
