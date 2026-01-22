using Abp.Application.Services;
using Abp.Application.Services.Dto;
using Elicom.Withdrawals.Dto;
using System.Threading.Tasks;

namespace Elicom.Withdrawals
{
    public interface IWithdrawAppService : IApplicationService
    {
        Task<WithdrawRequestDto> SubmitWithdrawRequest(CreateWithdrawRequestInput input);
        Task<PagedResultDto<WithdrawRequestDto>> GetMyWithdrawRequests(PagedAndSortedResultRequestDto input);
        Task ApproveWithdraw(ApproveWithdrawRequestInput input);
        Task RejectWithdraw(ApproveWithdrawRequestInput input);
    }
}
