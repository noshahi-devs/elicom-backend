using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Abp.Authorization;
using Abp.Domain.Repositories;
using Abp.Runtime.Session;
using Abp.UI;
using Elicom.Authorization.Users;
using Elicom.Cards.Dto;

using Elicom.Entities;
using Elicom.Cards.Dto;
using Microsoft.EntityFrameworkCore;

namespace Elicom.Cards
{
    [AbpAuthorize]
    public class CardAppService : ElicomAppServiceBase, ICardAppService
    {
        private readonly IRepository<VirtualCard, long> _cardRepository;
        private readonly IRepository<DepositRequest, Guid> _depositRepository;
        private readonly IRepository<WithdrawRequest, long> _withdrawRepository;
        private readonly UserManager _userManager;

        public CardAppService(
            IRepository<VirtualCard, long> cardRepository,
            IRepository<DepositRequest, Guid> depositRepository,
            IRepository<WithdrawRequest, long> withdrawRepository,
            UserManager userManager)
        {
            _cardRepository = cardRepository;
            _depositRepository = depositRepository;
            _withdrawRepository = withdrawRepository;
            _userManager = userManager;
        }

        public async Task<UserBalanceDto> GetBalance()
        {
            var userId = AbpSession.GetUserId();

            var totalBalance = await _cardRepository.GetAll()
                .Where(c => c.UserId == userId)
                .SumAsync(c => c.Balance);

            var pendingDeposit = await _depositRepository.GetAll()
                .Where(r => r.UserId == userId && r.Status == "Pending")
                .SumAsync(r => r.Amount);

            var pendingWithdrawal = await _withdrawRepository.GetAll()
                .Where(r => r.UserId == userId && r.Status == "Pending")
                .SumAsync(r => r.Amount);

            return new UserBalanceDto
            {
                TotalBalance = totalBalance,
                PendingDeposit = pendingDeposit,
                PendingWithdrawal = pendingWithdrawal,
                Currency = "USD"
            };
        }

        public async Task<VirtualCardDto> CreateVirtualCard(CreateVirtualCardInput input)
        {
            // Validate card type
            if (!new[] { "Visa", "MasterCard", "Amex" }.Contains(input.CardType))
            {
                throw new UserFriendlyException("Invalid card type. Must be Visa, MasterCard, or Amex.");
            }

            // Get current user
            var user = await _userManager.GetUserByIdAsync(AbpSession.GetUserId());

            // Generate card details
            var card = new VirtualCard
            {
                UserId = user.Id,
                CardNumber = GenerateCardNumber(input.CardType),
                CardType = input.CardType,
                HolderName = $"{user.Name} {user.Surname}".ToUpper(),
                ExpiryDate = DateTime.Now.AddYears(3).ToString("MM/yy"),
                Cvv = GenerateCVV(),
                Balance = 0,
                Currency = "USD",
                Status = "Active"
            };

            // Save to database
            var cardId = await _cardRepository.InsertAndGetIdAsync(card);

            // Map to DTO
            return new VirtualCardDto
            {
                CardId = cardId,
                CardNumber = FormatCardNumber(card.CardNumber),
                CardType = card.CardType,
                HolderName = card.HolderName,
                ExpiryDate = card.ExpiryDate,
                Cvv = card.Cvv,
                Balance = card.Balance,
                Currency = card.Currency,
                Status = card.Status
            };
        }

        public async Task<List<VirtualCardDto>> GetUserCards()
        {
            var userId = AbpSession.GetUserId();
            var cards = await _cardRepository.GetAllListAsync(c => c.UserId == userId);

            // Mask card numbers for security and map to DTO
            var dtos = cards.Select(card => new VirtualCardDto
            {
                CardId = card.Id,
                CardNumber = MaskCardNumber(FormatCardNumber(card.CardNumber)),
                CardType = card.CardType,
                HolderName = card.HolderName,
                ExpiryDate = card.ExpiryDate,
                Cvv = "***", // Hide CVV in list view
                Balance = card.Balance,
                Currency = card.Currency,
                Status = card.Status
            }).ToList();

            return dtos;
        }

        private string GenerateCardNumber(string cardType)
        {
            // Visa: starts with 4
            // MasterCard: starts with 5
            // Amex: starts with 3
            var prefix = cardType == "Visa" ? "4" : cardType == "MasterCard" ? "5" : "3";
            var random = new Random();
            
            // Generate 15 random digits
            var digits = string.Join("", Enumerable.Range(0, 15).Select(_ => random.Next(0, 10)));
            
            return prefix + digits;
        }

        private string GenerateCVV()
        {
            var random = new Random();
            return random.Next(100, 999).ToString();
        }

        private string FormatCardNumber(string cardNumber)
        {
            // Format: 4111 1111 1111 1234
            if (cardNumber.Length != 16)
                return cardNumber;

            return $"{cardNumber.Substring(0, 4)} {cardNumber.Substring(4, 4)} {cardNumber.Substring(8, 4)} {cardNumber.Substring(12, 4)}";
        }

        private string MaskCardNumber(string formattedCardNumber)
        {
            // 4111 1111 1111 1234 -> 4111 **** **** 1234
            var parts = formattedCardNumber.Split(' ');
            if (parts.Length != 4) return formattedCardNumber;

            return $"{parts[0]} **** **** {parts[3]}";
        }
    }
}
