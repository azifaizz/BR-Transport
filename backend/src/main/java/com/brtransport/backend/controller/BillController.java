package com.brtransport.backend.controller;

import com.brtransport.backend.entity.Bill;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bills")
public class BillController {

    @GetMapping
    public ResponseEntity<?> getBills(@RequestParam(defaultValue = "0") int page,
                                      @RequestParam(defaultValue = "20") int size,
                                      @RequestParam(defaultValue = "") String search) {
        
        // Mock paginated response matching API_CONTRACT.md
        Map<String, Object> response = new HashMap<>();
        response.put("content", Collections.singletonList(
                new Bill("1", "Acme Co.", new java.util.Date())
        ));
        response.put("totalElements", 1);
        response.put("totalPages", 1);
        response.put("number", 0);
        response.put("size", 20);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBill(@PathVariable String id) {
        return ResponseEntity.ok(new Bill(id, "Acme Co.", new java.util.Date()));
    }

    @PostMapping
    public ResponseEntity<?> createBill(@RequestBody Bill bill) {
        bill.setId("generated-id");
        bill.setCreatedAt(new java.util.Date());
        return ResponseEntity.ok(bill);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBill(@PathVariable String id, @RequestBody Bill bill) {
        bill.setId(id);
        return ResponseEntity.ok(bill);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBill(@PathVariable String id) {
        return ResponseEntity.noContent().build();
    }
}
