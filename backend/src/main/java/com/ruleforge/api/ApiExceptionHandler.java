package com.ruleforge.api;

import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(NoSuchElementException.class) ResponseEntity<?> missing(Exception e){return ResponseEntity.status(404).body(body("NOT_FOUND",e.getMessage(),404));}
    @ExceptionHandler(IllegalArgumentException.class) ResponseEntity<?> invalid(Exception e){return ResponseEntity.badRequest().body(body("INVALID_REQUEST",e.getMessage(),400));}
    @ExceptionHandler(IllegalStateException.class) ResponseEntity<?> conflict(Exception e){return ResponseEntity.status(409).body(body("RULE_CONFLICT",e.getMessage(),409));}
    @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> invalidBody(MethodArgumentNotValidException e){return ResponseEntity.badRequest().body(body("VALIDATION_FAILED","Request validation failed.",400));}
    @ExceptionHandler(Exception.class) ResponseEntity<?> internal(Exception e){return ResponseEntity.internalServerError().body(body("INTERNAL_ERROR","The request could not be completed.",500));}
    private Map<String,Object> body(String code,String message,int status){return Map.of("message",message,"statusCode",status,"errorCode",code,"timestamp",Instant.now());}
}
