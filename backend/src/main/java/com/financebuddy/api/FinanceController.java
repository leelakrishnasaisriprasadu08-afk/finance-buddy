package com.financebuddy.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class FinanceController {
    private final boolean finvuConfigured;
    private final boolean grokConfigured;

    public FinanceController(
        @Value("${integrations.finvu.enabled:false}") boolean finvuConfigured,
        @Value("${integrations.grok.enabled:false}") boolean grokConfigured) {
        this.finvuConfigured = finvuConfigured;
        this.grokConfigured = grokConfigured;
    }

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of("service", "finance-buddy-api", "status", "ok", "timestamp", Instant.now());
    }

    @PostMapping("/expenses")
    public ResponseEntity<Map<String, Object>> addExpense(@Valid @RequestBody ExpenseRequest request,
                                                            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Idempotency-Key is required"));
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
            "id", UUID.randomUUID(), "merchant", request.merchant(), "amountInr", request.amountInr(),
            "category", request.category(), "status", "accepted", "createdAt", Instant.now()));
    }

    @PostMapping("/connections/finvu/sync")
    public ResponseEntity<Map<String, Object>> syncFinvu() {
        if (!finvuConfigured) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", "Finvu integration is not configured", "nextStep", "Configure server-side Finvu credentials and consent handling"));
        }
        return ResponseEntity.accepted().body(Map.of("status", "queued", "provider", "finvu"));
    }

    @PostMapping("/assistant/messages")
    public ResponseEntity<Map<String, Object>> assistant(@Valid @RequestBody AssistantRequest request) {
        if (!grokConfigured) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                "error", "AI provider is not configured", "nextStep", "Configure XAI_API_KEY on the server"));
        }
        return ResponseEntity.accepted().body(Map.of("status", "queued", "message", request.message()));
    }

    public record ExpenseRequest(@NotBlank String merchant, @Positive long amountInr, @NotBlank String category) {}
    public record AssistantRequest(@NotBlank String message) {}
}
