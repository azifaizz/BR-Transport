package com.brtransport.backend.config;

import com.google.cloud.firestore.Firestore;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FirestoreConfig {

    @Bean
    public Firestore getFirestore() {
        try {
            return FirestoreClient.getFirestore();
        } catch (Exception e) {
            System.err.println("Firestore initialization skipped: " + e.getMessage());
            return null;
        }
    }
}
