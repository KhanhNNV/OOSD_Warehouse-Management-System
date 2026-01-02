package edu.uth.wms.config;

import com.nimbusds.jose.JOSEException;
import edu.uth.wms.service.auth.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.text.ParseException;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class JwtDecoderConfig implements JwtDecoder {
    private final JwtService jwtService;
    private NimbusJwtDecoder jwtDecoder;

    @Value("${app.jwt.secretKey}")
    private String secretKey;
    @Override
    public Jwt decode(String token) throws JwtException {
        try {

            if (Objects.isNull(jwtDecoder)) {
                SecretKey secretKeySpec = new SecretKeySpec(secretKey.getBytes(), "HS512");
                jwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                        .macAlgorithm(MacAlgorithm.HS512)
                        .build();
            }

            return jwtDecoder.decode(token);

        } catch (Exception e) {
            throw new JwtException(e.getMessage());
        }
    }
}
