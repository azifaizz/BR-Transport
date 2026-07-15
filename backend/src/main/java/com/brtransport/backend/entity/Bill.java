package com.brtransport.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Bill {
    private String id;
    
    // Auto-generated sequential bill number (e.g. 101, 102...)
    private Long billNumber;
    
    private String material;
    private String party;
    private String date; // Format: DD/MM/YYYY
    private String inTime;
    private String outTime;
    private String customer;
    private String vehicleNumber;
    
    private Double emptyWeight;
    private Double loadWeight;
    private Double netWeight;
    
    private String paymentType;
    private String deliveryType;
    private String remarks;
    
    // System fields
    private Boolean printStatus;
    private String createdBy;
    private Date createdAt;
    
    // Soft delete fields
    private Boolean isDeleted = false;
    private Date deletedAt;
    private String deletedBy;
}
