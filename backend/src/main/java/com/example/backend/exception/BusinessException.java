package com.example.backend.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final Object[] args;

    public BusinessException(String message) {
        super(message);
        this.errorCode = null;
        this.args = null;
    }

    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.args = null;
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = null;
        this.args = null;
    }

    public BusinessException(String message, String errorCode, Object... args) {
        super(message);
        this.errorCode = errorCode;
        this.args = args;
    }

    public BusinessException(String message, Throwable cause, String errorCode) {
        super(message, cause);
        this.errorCode = errorCode;
        this.args = null;
    }
}