package edu.uth.wms.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProductController {
    @GetMapping("/auth/login")
    public String login() {
        return "login";
    }

    @GetMapping("/logint2")
    public String login2() {
        return "login2";
    }
}
