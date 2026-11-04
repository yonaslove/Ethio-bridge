package com.ethiobridge.dto;

import java.util.List;

public class AuthResponseDto {

    private String token;
    private String tokenType = "Bearer";
    private String refreshToken;
    private Long expiresIn;
    private UserDto user;
    private List<String> roles;

    public AuthResponseDto() {}

    public AuthResponseDto(String token, UserDto user, List<String> roles) {
        this.token = token;
        this.tokenType = "Bearer";
        this.user = user;
        this.roles = roles;
    }

    public AuthResponseDto(String token, String refreshToken, Long expiresIn, UserDto user, List<String> roles) {
        this.token = token;
        this.tokenType = "Bearer";
        this.refreshToken = refreshToken;
        this.expiresIn = expiresIn;
        this.user = user;
        this.roles = roles;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public String getTokenType() { return tokenType; }
    public void setTokenType(String tokenType) { this.tokenType = tokenType; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public Long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(Long expiresIn) { this.expiresIn = expiresIn; }

    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }

    public List<String> getRoles() { return roles; }
    public void setRoles(List<String> roles) { this.roles = roles; }
}
