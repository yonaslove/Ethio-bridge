package com.ethiobridge.config;

import com.ethiobridge.service.AuthService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

@Component
public class DemoAuthFilter extends OncePerRequestFilter {

    private static final Map<String, List<String>> DEMO_USERS = new HashMap<>();

    static {
        DEMO_USERS.put("seeker1", List.of("ROLE_SEEKER"));
        DEMO_USERS.put("provider1", List.of("ROLE_PROVIDER"));
        DEMO_USERS.put("provider2", List.of("ROLE_PROVIDER"));
        DEMO_USERS.put("dualuser", List.of("ROLE_SEEKER", "ROLE_PROVIDER"));
        DEMO_USERS.put("admin", List.of("ROLE_ADMIN"));
    }

    private final AuthService authService;
    private final boolean demoAuthEnabled;

    public DemoAuthFilter(@Lazy AuthService authService,
                          @org.springframework.beans.factory.annotation.Value("${app.security.demo-auth.enabled:false}") boolean demoAuthEnabled) {
        this.authService = authService;
        this.demoAuthEnabled = demoAuthEnabled;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String demoHeader = request.getHeader("X-Demo-User");
        String authHeader = request.getHeader("Authorization");

        // 1. Check custom bearer session token from AuthService (eb-*)
        if (authHeader != null && authHeader.startsWith("Bearer eb-")) {
            String token = authHeader.substring("Bearer ".length()).trim();
            Authentication auth = authService.getAuthenticationForToken(token);
            if (auth != null) {
                SecurityContextHolder.getContext().setAuthentication(auth);
                HttpServletRequest wrapped = createHeaderHidingRequest(request, "Authorization");
                wrapped.setAttribute("AUTH_SESSION_TOKEN", token);
                filterChain.doFilter(wrapped, response);
                return;
            } else {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(org.springframework.http.MediaType.APPLICATION_JSON_VALUE);
                Map<String, Object> err = Map.of(
                        "timestamp", java.time.Instant.now().toString(),
                        "status", 401,
                        "error", "UNAUTHORIZED",
                        "message", "Session token is invalid or has expired",
                        "path", request.getRequestURI(),
                        "fieldErrors", List.of()
                );
                response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(err));
                return;
            }
        }

        // 2. Check demo user headers only if explicitly enabled in configuration
        if (demoAuthEnabled) {
            String selectedUser = null;
            boolean hideAuthHeader = false;
            if (demoHeader != null && !demoHeader.isBlank()) {
                selectedUser = demoHeader.trim().toLowerCase();
            } else if (authHeader != null && authHeader.startsWith("Bearer demo-")) {
                selectedUser = authHeader.substring("Bearer demo-".length()).trim().toLowerCase();
                hideAuthHeader = true;
            }

            if (selectedUser != null && DEMO_USERS.containsKey(selectedUser)) {
                List<SimpleGrantedAuthority> authorities = DEMO_USERS.get(selectedUser).stream()
                        .map(SimpleGrantedAuthority::new)
                        .toList();

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(selectedUser, null, authorities);
                SecurityContextHolder.getContext().setAuthentication(auth);

                if (hideAuthHeader) {
                    HttpServletRequest wrapped = createHeaderHidingRequest(request, "Authorization");
                    filterChain.doFilter(wrapped, response);
                    return;
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private HttpServletRequest createHeaderHidingRequest(HttpServletRequest request, String headerToHide) {
        return new jakarta.servlet.http.HttpServletRequestWrapper(request) {
            @Override
            public String getHeader(String name) {
                if (headerToHide.equalsIgnoreCase(name)) {
                    return null;
                }
                return super.getHeader(name);
            }

            @Override
            public Enumeration<String> getHeaders(String name) {
                if (headerToHide.equalsIgnoreCase(name)) {
                    return Collections.emptyEnumeration();
                }
                return super.getHeaders(name);
            }

            @Override
            public Enumeration<String> getHeaderNames() {
                List<String> names = Collections.list(super.getHeaderNames());
                names.removeIf(n -> headerToHide.equalsIgnoreCase(n));
                return Collections.enumeration(names);
            }
        };
    }
}

