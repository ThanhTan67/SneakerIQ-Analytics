package com.example.backend.mapper;

import com.example.backend.dto.AccountInforResponse;
import com.example.backend.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    AccountInforResponse toAccountInforResponse(User user);
    User toUser(AccountInforResponse accountInforResponse);
}
