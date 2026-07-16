package com.brtransport.backend.controller;

import com.brtransport.backend.entity.Bill;
import com.brtransport.backend.service.BillService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    private final BillService billService;

    @Autowired
    public BillController(BillService billService) {
        this.billService = billService;
    }

    @GetMapping
    public ResponseEntity<?> getBills(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size,
                                      @RequestParam(defaultValue = "") String search) {
        try {
            List<Bill> bills = billService.getAllBills();
            
            // Mock pagination wrapper for frontend compatibility
            Map<String, Object> response = new HashMap<>();
            response.put("content", bills);
            response.put("totalElements", bills.size());
            response.put("totalPages", 1);
            response.put("number", 0);
            response.put("size", bills.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error fetching bills: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/deleted")
    public ResponseEntity<?> getDeletedBills() {
        try {
            List<Bill> bills = billService.getDeletedBills();
            Map<String, Object> response = new HashMap<>();
            response.put("content", bills);
            response.put("totalElements", bills.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error fetching deleted bills\"}");
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        try {
            return ResponseEntity.ok(billService.getStats());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error fetching stats: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/next-number")
    public ResponseEntity<?> getNextBillNumber() {
        try {
            return ResponseEntity.ok(Map.of("nextBillNumber", billService.getNextBillNumber()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error fetching next bill number\"}");
        }
    }

    @PostMapping("/reset")
    public ResponseEntity<?> resetBillsAndCounter(@RequestParam(defaultValue = "101") long nextNumber) {
        try {
            billService.resetAllBills(nextNumber);
            return ResponseEntity.ok(Map.of("message", "Bills cleared and counter reset to " + nextNumber, "nextBillNumber", nextNumber));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error resetting bills: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBill(@PathVariable String id) {
        try {
            Bill bill = billService.getBill(id);
            if (bill != null) {
                return ResponseEntity.ok(bill);
            }
            return ResponseEntity.status(404).body("{\"message\": \"Bill not found\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error fetching bill\"}");
        }
    }

    @PostMapping
    public ResponseEntity<?> createBill(@RequestBody Bill bill) {
        try {
            Bill createdBill = billService.createBill(bill);
            return ResponseEntity.ok(createdBill);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error creating bill: " + e.getMessage() + "\"}");
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBill(@PathVariable String id, @RequestBody Bill bill) {
        try {
            bill.setId(id);
            Bill updatedBill = billService.updateBill(id, bill);
            return ResponseEntity.ok(updatedBill);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error updating bill\"}");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable String id) {
        try {
            billService.deleteBill(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error deleting bill\"}");
        }
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<?> restoreBill(@PathVariable String id) {
        try {
            Bill restored = billService.restoreBill(id);
            if (restored != null) {
                return ResponseEntity.ok(restored);
            }
            return ResponseEntity.status(404).body("{\"message\": \"Bill not found\"}");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("{\"message\": \"Error restoring bill\"}");
        }
    }
}
