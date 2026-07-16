package com.brtransport.backend.controller;

import com.brtransport.backend.dto.AuthResponse;
import com.brtransport.backend.dto.LoginRequest;
import com.brtransport.backend.entity.User;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        // Mock authentication for the sake of scaffolding
        if ("admin@brtransport.com".equalsIgnoreCase(loginRequest.getEmail()) && 
            ("admin@123".equals(loginRequest.getPassword()) || "admin123".equals(loginRequest.getPassword()) || "admin".equals(loginRequest.getPassword()))) {
            User user = new User("1", "admin@brtransport.com", null, "Admin", "ADMIN", new java.util.Date());
            return ResponseEntity.ok(new AuthResponse("mock-jwt-access-token", "mock-jwt-refresh-token", user));
        }
        return ResponseEntity.status(401).body("{\"message\": \"Invalid credentials\"}");
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        User user = new User("1", "admin@brtransport.com", null, "Admin", "ADMIN", new java.util.Date());
        return ResponseEntity.ok(user);
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.noContent().build();
    }
}
