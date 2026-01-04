package edu.uth.wms.repository;

import edu.uth.wms.model.InventoryTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ITransactionRepository extends JpaRepository<InventoryTransaction,Long> {
}
