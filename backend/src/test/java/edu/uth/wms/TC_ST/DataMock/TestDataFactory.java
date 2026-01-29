package edu.uth.wms.TC_ST.DataMock;

import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import java.time.LocalDate;
import java.util.ArrayList;

public class TestDataFactory {

    // 1. Tạo User giả (Manager & Staff)
    public static User createManager() {
        return User.builder()
                .id(1L)
                .username("manager_user")
                .fullName("Trưởng Kho A")
                .role(Role.MANAGER)
                .build();
    }

    public static User createStaff() {
        return User.builder()
                .id(2L)
                .username("staff_user")
                .fullName("Nhân Viên B")
                .role(Role.STAFF)
                .build();
    }

    // 2. Tạo Địa điểm (Location) giả
    public static Locations createLocation(Long id, String code, String zone) {
        return Locations.builder()
                .id(id)
                .code(code) // VD: "A-01-01"
                .locationType(LocationType.SHELF_STORAGE)
                .build();
    }

    // 3. Tạo Sản phẩm (Product) giả
    public static Products createProduct() {
        return Products.builder()
                .id(100L)
                .sku("SP-C")
                .name("Sản phẩm C")
                .unit("Cái")
                .category(Categories.builder().id(1L).name("Điện tử").build())
                .image_url("http://img.com/sp-c.jpg")
                .build();
    }

    // 4. Tạo Tồn kho (Inventory) giả
    public static Inventory createInventory(Products p, Locations l, int quantity) {
        return Inventory.builder()
                .id(500L)
                .product(p)
                .location(l)
                .quantity(quantity)
                .quantityAllocated(0) // Chưa có ai đặt
                .manufactureDate(LocalDate.now().minusMonths(1))
                .expiryDate(LocalDate.now().plusMonths(12))
                .build();
    }

    // 5. Tạo Phiên kiểm kê (Session) giả
    public static StocktakeSession createSession(String code, StocktakeStatus status) {
        return StocktakeSession.builder()
                .id(999L)
                .code(code)
                .status(status)
                .zoneCode("A")
                .assignments(new ArrayList<>())
                .build();
    }

    // 6. Tạo Nhiệm vụ đếm kệ (Assignment) giả
    public static StocktakeShelfAssignment createAssignment(StocktakeSession session, Locations loc, User staff,
            AssignmentStatus status) {
        return StocktakeShelfAssignment.builder()
                .id(2000L)
                .session(session)
                .location(loc)
                .staff(staff)
                .status(status)
                .details(new ArrayList<>())
                .build();
    }

    // 7. Tạo Chi tiết kiểm kê (Detail) giả
    public static StocktakeDetail createStocktakeDetail(StocktakeShelfAssignment assignment, Inventory inv,
            Integer systemQty) {
        return StocktakeDetail.builder()
                .id(3000L)
                .assignment(assignment)
                .inventory(inv)
                .systemQtySnapshot(systemQty)
                .actualCountedQty(null) // Mặc định chưa đếm
                .build();
    }

    /**
     * Tạo một kịch bản kiểm kê đầy đủ (Full Scenario) cho Unit Test
     * Bao gồm: Manager, Staff, Product C, Location A-01, Inventory (10), Session,
     * Assignment, Detail.
     */
    public static StocktakeScenario createFullScenario() {
        User manager = createManager();
        User staff = createStaff();
        Products product = createProduct();
        Locations location = createLocation(10L, "A-01-01", "A");
        Inventory inventory = createInventory(product, location, 10);

        StocktakeSession session = createSession("ST-FULL-001", StocktakeStatus.IN_PROGRESS);
        StocktakeShelfAssignment assignment = createAssignment(session, location, staff, AssignmentStatus.IN_PROGRESS);
        StocktakeDetail detail = createStocktakeDetail(assignment, inventory, 10);

        // Link them together
        session.getAssignments().add(assignment);
        assignment.getDetails().add(detail);

        return new StocktakeScenario(manager, staff, product, location, inventory, session, assignment, detail);
    }

    /**
     * Tạo một kịch bản kiểm kê đã hoàn thành đếm (Actual = 8, System = 10)
     */
    public static StocktakeScenario createCompletedScenario() {
        StocktakeScenario scenario = createFullScenario();
        scenario.detail.setActualCountedQty(8);
        scenario.assignment.setStatus(AssignmentStatus.COMPLETED);
        scenario.session.setStatus(StocktakeStatus.NEEDS_ADJUSTMENT);
        return scenario;
    }

    // Class helper để chứa toàn bộ dữ liệu mẫu
    public static class StocktakeScenario {
        public User manager;
        public User staff;
        public Products product;
        public Locations location;
        public Inventory inventory;
        public StocktakeSession session;
        public StocktakeShelfAssignment assignment;
        public StocktakeDetail detail;

        public StocktakeScenario(User manager, User staff, Products product, Locations location,
                Inventory inventory, StocktakeSession session,
                StocktakeShelfAssignment assignment, StocktakeDetail detail) {
            this.manager = manager;
            this.staff = staff;
            this.product = product;
            this.location = location;
            this.inventory = inventory;
            this.session = session;
            this.assignment = assignment;
            this.detail = detail;
        }
    }
}
