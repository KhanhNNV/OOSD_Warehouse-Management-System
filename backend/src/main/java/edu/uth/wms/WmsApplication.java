package edu.uth.wms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class WmsApplication {

	public static void main(String[] args) {
		//System.err.println("Backend is currently disabled.");
		SpringApplication.run(WmsApplication.class, args);
	}

}
