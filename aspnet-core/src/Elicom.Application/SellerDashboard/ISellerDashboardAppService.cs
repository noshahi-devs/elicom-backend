using Abp.Application.Services;
using System;
using System.Threading.Tasks;

namespace Elicom.SellerDashboard
{
    public interface ISellerDashboardAppService : IApplicationService
    {
        Task<SellerDashboardStatsDto> GetStats(Guid storeId);
    }

    public class SellerDashboardStatsDto
    {
        public decimal TotalSales { get; set; }
        public int TotalOrders { get; set; }
        public int PendingOrders { get; set; }
        public int ShippedOrders { get; set; }
        public int DeliveredOrders { get; set; }
        public decimal WalletBalance { get; set; }
    }
}
