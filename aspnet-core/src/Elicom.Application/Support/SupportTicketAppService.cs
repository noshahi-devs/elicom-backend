using Abp.Application.Services.Dto;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Abp.UI;
using Elicom.Authorization;
using Elicom.Entities;
using Elicom.Support.Dto;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.Support
{
    public class SupportTicketAppService : ElicomAppServiceBase, ISupportTicketAppService
    {
        private readonly IRepository<SupportTicket, Guid> _supportTicketRepository;

        public SupportTicketAppService(IRepository<SupportTicket, Guid> supportTicketRepository)
        {
            _supportTicketRepository = supportTicketRepository;
        }

        public async Task<SupportTicketDto> Create(CreateSupportTicketInput input)
        {
            var ticket = new SupportTicket
            {
                TenantId = AbpSession.TenantId ?? 3, // Default to EasyFinora if not specified
                Title = input.Title,
                Message = input.Message,
                Priority = input.Priority ?? "Medium",
                ContactEmail = input.ContactEmail,
                ContactName = input.ContactName,
                Status = "Open"
            };

            if (AbpSession.UserId.HasValue)
            {
                ticket.UserId = AbpSession.UserId.Value;
            }

            var id = await _supportTicketRepository.InsertAndGetIdAsync(ticket);
            return ObjectMapper.Map<SupportTicketDto>(ticket);
        }

        [AbpAuthorize]
        public async Task<PagedResultDto<SupportTicketDto>> GetMyTickets(PagedAndSortedResultRequestDto input)
        {
            var userId = AbpSession.GetUserId();
            var query = _supportTicketRepository.GetAll()
                .Where(t => t.UserId == userId);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<SupportTicketDto>(
                totalCount,
                ObjectMapper.Map<List<SupportTicketDto>>(items)
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task<PagedResultDto<SupportTicketDto>> GetAllTickets(PagedAndSortedResultRequestDto input)
        {
            var query = _supportTicketRepository.GetAll().Include(t => t.User);

            var totalCount = await query.CountAsync();
            var items = await query
                .OrderByDescending(t => t.CreationTime)
                .Skip(input.SkipCount)
                .Take(input.MaxResultCount)
                .ToListAsync();

            return new PagedResultDto<SupportTicketDto>(
                totalCount,
                ObjectMapper.Map<List<SupportTicketDto>>(items)
            );
        }

        [AbpAuthorize(PermissionNames.Pages_GlobalPay_Admin)]
        public async Task UpdateStatus(UpdateSupportTicketStatusInput input)
        {
            var ticket = await _supportTicketRepository.GetAsync(input.Id);
            ticket.Status = input.Status;
            ticket.AdminRemarks = input.AdminRemarks;
        }
    }
}
