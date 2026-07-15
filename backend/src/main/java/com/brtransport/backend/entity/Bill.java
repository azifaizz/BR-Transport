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
    private String partyName;
    private Date createdAt;
}
