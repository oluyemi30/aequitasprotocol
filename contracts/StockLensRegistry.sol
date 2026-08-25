// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title StockLensRegistry
 * @dev Onchain registry for StockLens AI users on Robinhood Chain.
 * Allows users to register and manage their portfolio profile name and metadata onchain.
 */
contract StockLensRegistry {
    struct Profile {
        string profileName;
        uint256 createdAt;
        uint256 updatedAt;
        bool exists;
    }

    // Mapping from user address to their StockLens profile
    mapping(address => Profile) private profiles;
    
    // Total count of registered profiles
    uint256 public totalProfiles;

    // Events
    event ProfileRegistered(address indexed user, string profileName, uint256 createdAt);
    event ProfileUpdated(address indexed user, string newProfileName, uint256 updatedAt);

    // Custom Errors
    error EmptyProfileName();
    error ProfileNameTooLong();
    error ProfileAlreadyExists();
    error ProfileDoesNotExist();

    /**
     * @notice Register a new StockLens profile for the sender
     * @param profileName The desired display handle / portfolio name
     */
    function registerProfile(string calldata profileName) external {
        bytes memory nameBytes = bytes(profileName);
        if (nameBytes.length == 0) revert EmptyProfileName();
        if (nameBytes.length > 32) revert ProfileNameTooLong();
        if (profiles[msg.sender].exists) revert ProfileAlreadyExists();

        profiles[msg.sender] = Profile({
            profileName: profileName,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            exists: true
        });

        totalProfiles += 1;

        emit ProfileRegistered(msg.sender, profileName, block.timestamp);
    }

    /**
     * @notice Update the profile name of an existing profile
     * @param newProfileName The new display name
     */
    function updateProfileName(string calldata newProfileName) external {
        bytes memory nameBytes = bytes(newProfileName);
        if (nameBytes.length == 0) revert EmptyProfileName();
        if (nameBytes.length > 32) revert ProfileNameTooLong();
        if (!profiles[msg.sender].exists) revert ProfileDoesNotExist();

        profiles[msg.sender].profileName = newProfileName;
        profiles[msg.sender].updatedAt = block.timestamp;

        emit ProfileUpdated(msg.sender, newProfileName, block.timestamp);
    }

    /**
     * @notice Retrieve profile details for a given address
     * @param user The address to query
     * @return profileName The registered profile name
     * @return createdAt The timestamp when the profile was registered
     */
    function getProfile(address user) external view returns (string memory profileName, uint256 createdAt) {
        Profile memory p = profiles[user];
        if (!p.exists) revert ProfileDoesNotExist();
        return (p.profileName, p.createdAt);
    }

    /**
     * @notice Check if an address has a registered profile
     * @param user The address to check
     * @return exists True if the profile exists
     */
    function hasProfile(address user) external view returns (bool exists) {
        return profiles[user].exists;
    }
}
