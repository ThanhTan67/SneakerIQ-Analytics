package com.example.backend.service;

import com.example.backend.dto.AccountInforResponse;
import com.example.backend.entity.User;
import com.example.backend.exception.BusinessException;
import com.example.backend.mapper.UserMapper;
import com.example.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AccountService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AccountService.class);
    private final UserMapper userMapper;
    private final UserRepository userRepository;

    public AccountInforResponse getAccountInfo(String username) {
        User user = userRepository.findUserByFullName(username).orElse(null);

        if (user == null) {
            log.warn("User not found: {}", username);
            throw new BusinessException("User not found", "USER_NOT_FOUND");
        }

        log.info("Get account info successful: {}", username);
        return userMapper.toAccountInforResponse(user);
    }


}
