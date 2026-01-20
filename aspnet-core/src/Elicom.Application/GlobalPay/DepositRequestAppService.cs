using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.GlobalPay.Dto;
using Elicom.Wallets;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.GlobalPay
{
    [AbpAuthorize]
    public class DepositRequestAppService : ElicomAppServiceBase, IDepositRequestAppService
    {
        private readonly IRepository<DepositRequest, Guid> _depositRequestRepository;
        private readonly IWalletManager _walletManager;

        public DepositRequestAppService(
            IRepository<DepositRequest, Guid> depositRequestRepository,
            IWalletManager walletManager)
        {
            _depositRequestRepository = depositRequestRepository;
            _walletManager = walletManager;
        }

        public async Task<DepositRequestDto> Create(CreateDepositRequestInput input)
        {
            var user = await GetCurrentUserAsync();

            var request = new DepositRequest
            {
                UserId = user.Id,
                Amount = input.Amount,
                Country = input.Country,
                ProofImage = input.ProofImage,
                Status = "Pending",
                SourcePlatform = "GlobalPay",
                DestinationAccount = GetDestinationAccountForCountry(input.Country)
            };

            await _depositRequestRepository.InsertAsync(request);
            return ObjectMapper.Map<DepositRequestDto>(request);
        }

        public async Task<PagedResultDto<DepositRequestDto>> GetMyRequests(PagedAndSortedResultRequestDto input)
        {
            var user = await GetCurrentUserAsync();

            var query = _depositRequestRepository.GetAll()
                .Where(r => r.UserId == user.Id);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<DepositRequestDto>(
                totalCount,
                ObjectMapper.Map<List<DepositRequestDto>>(items)
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task<PagedResultDto<DepositRequestDto>> GetAllRequests(PagedAndSortedResultRequestDto input)
        {
            var query = _depositRequestRepository.GetAll().Include(r => r.User);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(r => r.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<DepositRequestDto>(
                totalCount,
                ObjectMapper.Map<List<DepositRequestDto>>(items)
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task Approve(ApproveDepositRequestInput input)
        {
            var request = await _depositRequestRepository.GetAsync(input.Id);

            if (request.Status != "Pending")
            {
                throw new UserFriendlyException("Only pending requests can be approved.");
            }

            request.Status = "Approved";
            request.AdminRemarks = input.AdminRemarks;

            // ACTUAL DEPOSIT INTO WALLET
            await _walletManager.DepositAsync(
                request.UserId,
                request.Amount,
                request.Id.ToString(),
                $"Manual Deposit Approved - Reference: {request.Id}"
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task Reject(ApproveDepositRequestInput input)
        {
            var request = await _depositRequestRepository.GetAsync(input.Id);

            if (request.Status != "Pending")
            {
                throw new UserFriendlyException("Only pending requests can be rejected.");
            }

            request.Status = "Rejected";
            request.AdminRemarks = input.AdminRemarks;
        }

        private string GetDestinationAccountForCountry(string country)
        {
            // Dummy logic: In a real app, this would come from settings or a separate entity
            return country.ToLower() switch
            {
                "uk" => "Barclays Bank - Acc: 12345678",
                "usa" => "Chase Bank - Acc: 98765432",
                _ => "Central Global Account - Acc: 00000000"
            };
        }
    }
}
