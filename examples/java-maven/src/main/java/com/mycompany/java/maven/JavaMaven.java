package com.mycompany.java.maven;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 *
 * @author Lagoni
 */
public class JavaMaven {
    public static void main(String[] args) throws JsonProcessingException {
        UserSignedUp payload = new UserSignedUp();
        payload.setDisplayName("Lagoni");
        payload.setEmail("lagoni@lagoni.com");
        ObjectMapper objm = new ObjectMapper();
        String payloadJSON = objm.writeValueAsString(payload);
        System.out.println("User was: " + payloadJSON);
    }
}
