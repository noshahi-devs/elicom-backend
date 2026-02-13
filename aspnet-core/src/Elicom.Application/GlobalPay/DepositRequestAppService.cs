using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.UI;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.GlobalPay.Dto;
using Elicom.Wallets;
using Elicom.Cards;
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
        private readonly IRepository<AppTransaction, long> _transactionRepository;
        private readonly IRepository<VirtualCard, long> _cardRepository;

        public DepositRequestAppService(
            IRepository<DepositRequest, Guid> depositRequestRepository,
            IWalletManager walletManager,
            IRepository<VirtualCard, long> cardRepository,
            IRepository<AppTransaction, long> transactionRepository)
        {
            _depositRequestRepository = depositRequestRepository;
            _walletManager = walletManager;
            _cardRepository = cardRepository;
            _transactionRepository = transactionRepository;
        }

        public async Task<DepositRequestDto> Create(CreateDepositRequestInput input)
        {
            var user = await GetCurrentUserAsync();

            if (!AbpSession.TenantId.HasValue)
            {
                throw new UserFriendlyException("Tenant is required to create a deposit request.");
            }

            var request = new DepositRequest
            {
                TenantId = AbpSession.TenantId.Value,
                UserId = user.Id,
                CardId = input.CardId,
                Amount = input.Amount,
                LocalAmount = input.LocalAmount,
                LocalCurrency = input.LocalCurrency,
                Country = input.Country,
                ProofImage = input.ProofImage,
                Status = "Pending",
                Method = input.Method ?? "P2P",
                SourcePlatform = AbpSession.TenantId == 3 ? "EasyFinora" : "GlobalPay",
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

            var dtos = items.Select(item =>
            {
                var dto = ObjectMapper.Map<DepositRequestDto>(item);
                dto.HasProof = !string.IsNullOrEmpty(item.ProofImage);
                dto.ProofImage = null; // Don't send large base64 in list
                
                if (item.User != null)
                {
                    dto.Name = item.User.Name;
                    dto.Surname = item.User.Surname;
                    dto.FullName = (item.User.Name + " " + item.User.Surname).Trim();
                    if (string.IsNullOrWhiteSpace(dto.FullName))
                    {
                        dto.FullName = item.User.UserName;
                    }
                }
                return dto;
            }).ToList();

            return new PagedResultDto<DepositRequestDto>(
                totalCount,
                dtos
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task<string> GetProofImage(Guid id)
        {
            var request = await _depositRequestRepository.GetAsync(id);
            return request.ProofImage;
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

            // ACTUAL DEPOSIT INTO WALLET (Existing GlobalPay logic)
            await _walletManager.DepositAsync(
                request.UserId,
                request.Amount,
                request.Id.ToString(),
                $"Manual Deposit Approved - Reference: {request.Id}"
            );

            // UPDATE VIRTUAL CARD BALANCE (New EasyFinora logic)
            if (request.CardId.HasValue)
            {
                var card = await _cardRepository.GetAsync(request.CardId.Value);
                card.Balance += request.Amount;

                // RECORD TRANSACTION
                await _transactionRepository.InsertAsync(new AppTransaction
                {
                    UserId = request.UserId,
                    CardId = request.CardId,
                    Amount = request.Amount,
                    MovementType = "Credit",
                    Category = "Deposit",
                    ReferenceId = request.Id.ToString(),
                    Description = $"Deposit Approved for Card {request.CardId}"
                });
            }
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
            if (string.IsNullOrWhiteSpace(country))
            {
                return "Central Global Account - Acc: 00000000";
            }

            return country.ToLower() switch
            {
                "uk" => "Barclays Bank - Acc: 12345678",
                "usa" => "Chase Bank - Acc: 98765432",
                _ => "Central Global Account - Acc: 00000000"
            };
        }
    }
}
