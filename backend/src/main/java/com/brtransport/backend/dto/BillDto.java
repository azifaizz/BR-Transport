package com.brtransport.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BillDto {
    private String id;
    private Long billNumber;
    
    private String material;
    private String party;
    private String date;
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
    
    private Boolean printStatus;
    private String createdBy;
    private Date createdAt;
    
    private Boolean isDeleted;
    private Date deletedAt;
    private String deletedBy;
}
