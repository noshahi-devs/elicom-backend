using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Elicom.Entities;
using Elicom.Transactions.Dto;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Transactions
{
    [AbpAuthorize]
    public class TransactionAppService : ElicomAppServiceBase, ITransactionAppService
    {
        private readonly IRepository<AppTransaction, long> _transactionRepository;

        public TransactionAppService(IRepository<AppTransaction, long> transactionRepository)
        {
            _transactionRepository = transactionRepository;
        }

        public async Task<PagedResultDto<TransactionDto>> GetHistory(PagedAndSortedResultRequestDto input)
        {
            var userId = AbpSession.GetUserId();
            var query = _transactionRepository.GetAll().Where(t => t.UserId == userId);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<TransactionDto>(
                totalCount,
                items.Select(t => new TransactionDto
                {
                    Id = t.Id,
                    CardId = t.CardId,
                    Amount = t.Amount,
                    TransactionType = t.TransactionType,
                    Category = t.Category,
                    ReferenceId = t.ReferenceId,
                    Description = t.Description,
                    CreationTime = t.CreationTime
                }).ToList()
            );
        }
    }
}
