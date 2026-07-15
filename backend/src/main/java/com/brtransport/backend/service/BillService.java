package com.brtransport.backend.service;

import com.brtransport.backend.entity.Bill;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class BillService {

    @Autowired(required = false)
    private Firestore firestore;
    
    private static final String COLLECTION_NAME = "bills";
    private static final String METADATA_COLLECTION = "metadata";
    private static final String COUNTER_DOC = "billCounter";

    public BillService() {
    }

    public Bill createBill(Bill bill) throws ExecutionException, InterruptedException {
        if (bill.getId() == null || bill.getId().isEmpty()) {
            bill.setId(UUID.randomUUID().toString());
        }
        
        bill.setCreatedAt(new Date());
        
        if (firestore != null) {
            DocumentReference counterRef = firestore.collection(METADATA_COLLECTION).document(COUNTER_DOC);
            
            ApiFuture<Long> transaction = firestore.runTransaction(tx -> {
                DocumentSnapshot snapshot = tx.get(counterRef).get();
                long newBillNumber = 101L; 
                if (snapshot.exists() && snapshot.contains("currentValue")) {
                    newBillNumber = snapshot.getLong("currentValue") + 1;
                }
                tx.set(counterRef, java.util.Map.of("currentValue", newBillNumber));
                return newBillNumber;
            });
            
            bill.setBillNumber(transaction.get());
            
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(bill.getId());
            ApiFuture<WriteResult> result = docRef.set(bill);
            result.get(); 
        } else {
            System.err.println("WARN: Firestore is not initialized. Returning mock bill.");
            bill.setBillNumber((long) (Math.random() * 1000) + 101);
        }
        
        return bill;
    }

    public Bill getBill(String id) throws ExecutionException, InterruptedException {
        if (firestore != null) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
            ApiFuture<DocumentSnapshot> future = docRef.get();
            DocumentSnapshot document = future.get();
            if (document.exists()) {
                return document.toObject(Bill.class);
            }
        }
        return null;
    }

    public List<Bill> getAllBills() throws ExecutionException, InterruptedException {
        if (firestore != null) {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).orderBy("createdAt", Query.Direction.DESCENDING).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<Bill> bills = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                Bill bill = document.toObject(Bill.class);
                if (bill.getIsDeleted() == null || !bill.getIsDeleted()) {
                    bills.add(bill);
                }
            }
            return bills;
        }
        return new ArrayList<>();
    }

    public List<Bill> getDeletedBills() throws ExecutionException, InterruptedException {
        if (firestore != null) {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).orderBy("deletedAt", Query.Direction.DESCENDING).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<Bill> bills = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                Bill bill = document.toObject(Bill.class);
                if (Boolean.TRUE.equals(bill.getIsDeleted())) {
                    bills.add(bill);
                }
            }
            return bills;
        }
        return new ArrayList<>();
    }

    public Bill updateBill(String id, Bill bill) throws ExecutionException, InterruptedException {
        if (firestore != null) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
            ApiFuture<WriteResult> result = docRef.set(bill);
            result.get();
        }
        return bill;
    }

    public Map<String, Long> getStats() throws ExecutionException, InterruptedException {
        Map<String, Long> stats = new java.util.HashMap<>();
        if (firestore != null) {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            
            long total = documents.size();
            long today = 0;
            long thisMonth = 0;
            
            java.util.Calendar cal = java.util.Calendar.getInstance();
            cal.set(java.util.Calendar.HOUR_OF_DAY, 0);
            cal.set(java.util.Calendar.MINUTE, 0);
            cal.set(java.util.Calendar.SECOND, 0);
            cal.set(java.util.Calendar.MILLISECOND, 0);
            Date startOfDay = cal.getTime();
            
            cal.set(java.util.Calendar.DAY_OF_MONTH, 1);
            Date startOfMonth = cal.getTime();
            
            for (QueryDocumentSnapshot document : documents) {
                Bill bill = document.toObject(Bill.class);
                if (Boolean.TRUE.equals(bill.getIsDeleted())) {
                    continue;
                }
                
                Date createdAt = document.getDate("createdAt");
                if (createdAt != null) {
                    if (!createdAt.before(startOfDay)) {
                        today++;
                    }
                    if (!createdAt.before(startOfMonth)) {
                        thisMonth++;
                    }
                }
            }
            
            stats.put("totalBills", total);
            stats.put("todayBills", today);
            stats.put("monthBills", thisMonth);
        } else {
            stats.put("totalBills", 0L);
            stats.put("todayBills", 0L);
            stats.put("monthBills", 0L);
        }
        return stats;
    }

    public Long getNextBillNumber() throws ExecutionException, InterruptedException {
        if (firestore != null) {
            DocumentReference counterRef = firestore.collection(METADATA_COLLECTION).document(COUNTER_DOC);
            DocumentSnapshot snapshot = counterRef.get().get();
            if (snapshot.exists() && snapshot.contains("currentValue")) {
                return snapshot.getLong("currentValue") + 1;
            }
        }
        return 101L;
    }

    public void deleteBill(String id) throws ExecutionException, InterruptedException {
        if (firestore != null) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
            Bill bill = docRef.get().get().toObject(Bill.class);
            if (bill != null) {
                bill.setIsDeleted(true);
                bill.setDeletedAt(new Date());
                bill.setDeletedBy("Admin");
                docRef.set(bill).get();
            }
        }
    }

    public Bill restoreBill(String id) throws ExecutionException, InterruptedException {
        if (firestore != null) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
            Bill bill = docRef.get().get().toObject(Bill.class);
            if (bill != null) {
                bill.setIsDeleted(false);
                bill.setDeletedAt(null);
                bill.setDeletedBy(null);
                docRef.set(bill).get();
                return bill;
            }
        }
        return null;
    }
}
