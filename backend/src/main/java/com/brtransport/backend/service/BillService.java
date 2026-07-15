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
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.Iterator;

@Service
public class BillService {

    @Autowired(required = false)
    private Firestore firestore;

    private static final String COLLECTION_NAME = "bills";
    private static final String METADATA_COLLECTION = "metadata";
    private static final String COUNTER_DOC = "billCounter";

    // In-memory fallback for local development without Firebase credentials
    private static final List<Bill> mockBills = new CopyOnWriteArrayList<>();

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
            System.err.println("WARN: Firestore is not initialized. Saving bill in-memory.");
            bill.setBillNumber(mockBillCounter);
            mockBillCounter++;
            mockBills.add(0, bill); // Add to front so it shows up first
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
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                    .orderBy("createdAt", Query.Direction.DESCENDING).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<Bill> bills = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                Bill bill = document.toObject(Bill.class);
                if (bill.getIsDeleted() == null || !bill.getIsDeleted()) {
                    bills.add(bill);
                }
            }
            return bills;
        } else {
            List<Bill> bills = new ArrayList<>();
            for (Bill bill : mockBills) {
                if (bill.getIsDeleted() == null || !bill.getIsDeleted()) {
                    bills.add(bill);
                }
            }
            return bills;
        }
    }

    public List<Bill> getDeletedBills() throws ExecutionException, InterruptedException {
        long fifteenDaysMillis = 15L * 24 * 60 * 60 * 1000;
        Date cutoffDate = new Date(System.currentTimeMillis() - fifteenDaysMillis);

        if (firestore != null) {
            ApiFuture<QuerySnapshot> future = firestore.collection(COLLECTION_NAME)
                    .whereEqualTo("isDeleted", true)
                    .get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            List<Bill> bills = new ArrayList<>();
            for (QueryDocumentSnapshot document : documents) {
                Bill bill = document.toObject(Bill.class);
                if (bill.getDeletedAt() != null && bill.getDeletedAt().before(cutoffDate)) {
                    // Permanently remove bill older than 15 days
                    firestore.collection(COLLECTION_NAME).document(bill.getId()).delete();
                } else {
                    bills.add(bill);
                }
            }
            // Sort descending by deletedAt in memory after fetching only the small subset of deleted bills
            bills.sort((a, b) -> {
                if (a.getDeletedAt() == null || b.getDeletedAt() == null) return 0;
                return b.getDeletedAt().compareTo(a.getDeletedAt());
            });
            return bills;
        } else {
            List<Bill> bills = new ArrayList<>();
            Iterator<Bill> iterator = mockBills.iterator();
            while (iterator.hasNext()) {
                Bill bill = iterator.next();
                if (Boolean.TRUE.equals(bill.getIsDeleted())) {
                    if (bill.getDeletedAt() != null && bill.getDeletedAt().before(cutoffDate)) {
                        iterator.remove(); // Permanently remove from mock
                    } else {
                        bills.add(bill);
                    }
                }
            }
            return bills;
        }
    }

    public Bill updateBill(String id, Bill bill) throws ExecutionException, InterruptedException {
        if (firestore != null) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document(id);
            ApiFuture<WriteResult> result = docRef.set(bill);
            result.get();
        } else {
            for (int i = 0; i < mockBills.size(); i++) {
                if (mockBills.get(i).getId().equals(id)) {
                    mockBills.set(i, bill);
                    break;
                }
            }
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

    private long mockBillCounter = 101L;

    public Long getNextBillNumber() throws ExecutionException, InterruptedException {
        if (firestore != null) {
            DocumentReference counterRef = firestore.collection(METADATA_COLLECTION).document(COUNTER_DOC);
            DocumentSnapshot snapshot = counterRef.get().get();
            if (snapshot.exists() && snapshot.contains("currentValue")) {
                return snapshot.getLong("currentValue") + 1;
            }
        }
        return mockBillCounter;
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
        } else {
            for (Bill bill : mockBills) {
                if (bill.getId().equals(id)) {
                    bill.setIsDeleted(true);
                    bill.setDeletedAt(new Date());
                    bill.setDeletedBy("Admin");
                    break;
                }
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
        } else {
            for (Bill bill : mockBills) {
                if (bill.getId().equals(id)) {
                    bill.setIsDeleted(false);
                    bill.setDeletedAt(null);
                    bill.setDeletedBy(null);
                    return bill;
                }
            }
        }
        return null;
    }
}
