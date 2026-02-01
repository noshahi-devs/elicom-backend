using Abp.Authorization;
using Abp.Domain.Repositories;
using Elicom.Entities;
using Elicom.Wallets;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Elicom.SellerDashboard
{
    [AbpAuthorize]
    public class SellerDashboardAppService : ElicomAppServiceBase, ISellerDashboardAppService
    {
        private readonly IRepository<Order, Guid> _orderRepository;
        private readonly IRepository<StoreProduct, Guid> _storeProductRepository;
        private readonly IWalletManager _walletManager;

        public SellerDashboardAppService(
            IRepository<Order, Guid> orderRepository,
            IRepository<StoreProduct, Guid> storeProductRepository,
            IWalletManager walletManager)
        {
            _orderRepository = orderRepository;
            _storeProductRepository = storeProductRepository;
            _walletManager = walletManager;
        }

        public async Task<SellerDashboardStatsDto> GetStats(Guid storeId)
        {
            var user = await GetCurrentUserAsync();

            // Find orders that contain products from this store
            var storeOrders = await _orderRepository.GetAll()
                .Include(o => o.OrderItems)
                .Where(o => o.OrderItems.Any(oi => _storeProductRepository.GetAll().Any(sp => sp.Id == oi.StoreProductId && sp.StoreId == storeId)))
                .ToListAsync();

            var stats = new SellerDashboardStatsDto
            {
                TotalOrders = storeOrders.Count,
                PendingOrders = storeOrders.Count(o => o.Status == "Pending"),
                ShippedOrders = storeOrders.Count(o => o.Status == "Shipped" || o.Status == "Processing"),
                DeliveredOrders = storeOrders.Count(o => o.Status == "Delivered"),
                TotalSales = storeOrders.Where(o => o.Status == "Delivered" || o.Status == "Shipped" || o.Status == "Processing").Sum(o => o.TotalAmount),
                WalletBalance = await _walletManager.GetBalanceAsync(user.Id)
            };

            return stats;
        }
    }
}
