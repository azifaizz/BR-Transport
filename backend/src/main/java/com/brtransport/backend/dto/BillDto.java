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
    private String partyName;
    private Date createdAt;
}
