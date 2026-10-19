package com.ruleforge.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.*;

@Configuration
public class CorsConfiguration implements WebMvcConfigurer {
    @Override public void addCorsMappings(CorsRegistry registry){registry.addMapping("/api/v1/**").allowedOrigins("http://localhost:5173","http://127.0.0.1:5173","http://localhost:4173").allowedMethods("GET","POST","PUT","OPTIONS").allowedHeaders("Content-Type","Accept");}
}
