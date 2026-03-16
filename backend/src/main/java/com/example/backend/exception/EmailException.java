package com.example.backend.exception;

public class EmailException extends RuntimeException {

    public EmailException(String message) {
        super(message);
    }

    public EmailException(String message, Throwable cause) {
        super(message, cause);
    }

    public EmailException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }

    private String errorCode;

    public String getErrorCode() {
        return errorCode;
    }
}