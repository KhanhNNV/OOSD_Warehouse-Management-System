package edu.uth.wms;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Main application test class
 * 
 * Note: Individual test classes for specific features have been created:
 * - TC_OUT_01_FIFOTest: Tests for FIFO automatic warehouse retention
 * - TC_OUT_02_ValidateInventoryTest: Tests for inventory validation
 * - TC_OUT_03_StaffPickingTest: Tests for staff picking process
 * - TC_OUT_04_WarehouseCompletionTest: Tests for warehouse completion
 * 
 * These tests are currently disabled by default. To run them individually:
 * - Remove @Disabled annotation from specific test methods
 * - Run the specific test class directly
 */
@Disabled // <---  BỎ QUA FILE TEST NÀY
@SpringBootTest
class WmsApplicationTests {

	@Test
	@Disabled("Context loading test disabled - Enable when needed")
	void contextLoads() {
		// This test verifies that the Spring application context loads successfully
	}

	@Test
	@Disabled("Placeholder for additional integration tests")
	void additionalTests() {
		// Add additional integration tests here
	}

}