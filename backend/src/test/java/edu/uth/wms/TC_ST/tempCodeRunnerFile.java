    @Test
    void testLogic_CannotApproveIfNotReady() {
        System.out.println("--- Test Logic: Không thể Approve khi chưa xong ---");

        scenario.session.setStatus(StocktakeStatus.IN_PROGRESS); // Vẫn đang đếm
        ApproveAdjustmentRequest req = new ApproveAdjustmentRequest();
        req.setSessionId(scenario.session.getId());

        when(userRepo.findByUsername(scenario.manager.getUsername())).thenReturn(Optional.of(scenario.manager));
        when(sessionRepo.findById(scenario.session.getId())).thenReturn(Optional.of(scenario.session));

        Exception result = assertThrows(BadRequestException.class, () -> {
            stocktakeService.approveAdjustment(scenario.manager.getUsername(), req);
        });

        assertEquals("Chỉ có thể điều chỉnh phiên đang ở trạng thái CẦN ĐIỀU CHỈNH hoặc HOÀN THÀNH",
                result.getMessage());
        System.out.println("✅ Đã chặn duyệt khi session chưa hoàn thành!");
    }