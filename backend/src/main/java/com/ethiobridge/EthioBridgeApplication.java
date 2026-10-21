package com.ethiobridge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class EthioBridgeApplication {

    public static void main(String[] args) {
        SpringApplication.run(EthioBridgeApplication.class, args);
    }
}
