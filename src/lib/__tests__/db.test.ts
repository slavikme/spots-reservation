import { SpotStatus, User } from "@/types/db.types";

// Mock console methods to prevent noise in test output
global.console.log = jest.fn();
global.console.info = jest.fn();
global.console.error = jest.fn();
global.console.warn = jest.fn();

jest.isolateModules(() => {
  const mockSql = jest.fn();

  // Mock neon inside isolateModules
  jest.mock("@neondatabase/serverless", () => {
    return {
      neon: jest.fn(() => mockSql),
    };
  });

  describe("Database Operations", () => {
    let db: typeof import("../db");

    beforeAll(async () => {
      db = await import("../db");
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    describe("insertUser", () => {
      it("should successfully insert a user", async () => {
        const email = "test@example.com";
        const name = "Test User";
        const mockUser: Omit<User, "id"> = {
          email,
          name,
          role: "user",
          created_at: new Date(),
        };

        mockSql.mockResolvedValueOnce([mockUser]);

        const result = await db.insertUser(email, name);
        expect(result).toEqual(mockUser);
        expect(mockSql).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.stringContaining("INSERT INTO users"),
            expect.stringContaining("RETURNING email, name, role, created_at"),
          ]),
          email,
          name,
          "user"
        );
      });

      it("should throw error on insert failure", async () => {
        mockSql.mockRejectedValueOnce(new Error("DB Error"));

        await expect(
          db.insertUser("test@example.com", "Test User")
        ).rejects.toThrow("Failed to insert user");
      });
    });

    describe("insertSpot", () => {
      it("should successfully insert a spot", async () => {
        const mockSpot = { id: "A1", created_at: new Date() };
        mockSql.mockResolvedValueOnce([mockSpot]);

        const result = await db.insertSpot("A1");
        expect(result).toEqual(mockSpot);
        expect(mockSql).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.stringContaining("INSERT INTO spots"),
            expect.stringContaining("RETURNING id, created_at"),
          ]),
          "A1"
        );
      });

      it("should throw error on insert failure", async () => {
        mockSql.mockRejectedValueOnce(new Error("DB Error"));

        await expect(db.insertSpot("A1")).rejects.toThrow(
          "Failed to insert spot"
        );
      });
    });

    describe("getSpotStatus", () => {
      it("should return spot status for given timestamp", async () => {
        const mockStatus: SpotStatus[] = [
          {
            spot_id: "A1",
            user_name: "Test User",
            start_time: new Date(),
            end_time: new Date(),
          },
        ];

        mockSql.mockResolvedValueOnce(mockStatus);

        const result = await db.getSpotStatus(Date.now());
        expect(result).toEqual(mockStatus);
        expect(mockSql).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.stringContaining("spot_assignments"),
            expect.stringContaining("SELECT"),
          ]),
          expect.any(Date),
          expect.any(Date)
        );
      });

      it("should throw error when fetch fails", async () => {
        mockSql.mockRejectedValueOnce(new Error("DB Error"));

        await expect(db.getSpotStatus(Date.now())).rejects.toThrow(
          "Failed to fetch spot status"
        );
      });
    });

    describe("assignSpotWithEndTime", () => {
      const testParams = {
        userEmail: "test@example.com",
        spotId: "A1",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-02"),
      };

      it("should successfully assign spot with end time", async () => {
        mockSql.mockResolvedValueOnce([]); // No overlapping assignments
        mockSql.mockResolvedValueOnce([]); // Successful insert

        await expect(
          db.assignSpotWithEndTime(
            testParams.userEmail,
            testParams.spotId,
            testParams.startTime,
            testParams.endTime
          )
        ).resolves.not.toThrow();
      });

      it("should throw error if start time is after end time", async () => {
        await expect(
          db.assignSpotWithEndTime(
            testParams.userEmail,
            testParams.spotId,
            testParams.endTime, // Swapped
            testParams.startTime
          )
        ).rejects.toThrow("Start time must be before end time");
      });

      it("should throw error if spot is already reserved", async () => {
        mockSql.mockResolvedValueOnce([
          {
            user_email: "other@example.com",
            start_time: new Date(),
            end_time: new Date(),
          },
        ]);

        await expect(
          db.assignSpotWithEndTime(
            testParams.userEmail,
            testParams.spotId,
            testParams.startTime,
            testParams.endTime
          )
        ).rejects.toThrow("Spot is already reserved");
      });
    });

    describe("releaseSpotReservation", () => {
      const testParams = {
        requestingUserEmail: "test@example.com",
        spotId: "A1",
        startTime: new Date("2024-01-01"),
        endTime: new Date("2024-01-02"),
      };

      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should successfully release user's own reservation", async () => {
        // Mock overlapping assignments first
        mockSql.mockResolvedValueOnce([
          {
            user_email: "test@example.com",
            start_time: new Date("2024-01-01"),
            end_time: new Date("2024-01-02"),
          },
        ]);

        // Then mock user role check
        mockSql.mockResolvedValueOnce([{ role: "user" }]);

        // Mock successful deletion
        mockSql.mockResolvedValueOnce([]);

        await expect(
          db.releaseSpotReservation(
            testParams.requestingUserEmail,
            testParams.spotId,
            testParams.startTime,
            testParams.endTime
          )
        ).resolves.not.toThrow();
      });

      it("should throw error if user tries to release someone else's reservation", async () => {
        // Mock overlapping assignments check
        mockSql.mockResolvedValueOnce([
          {
            user_email: "other@example.com",
            start_time: new Date(),
            end_time: new Date(),
          },
        ]);

        // Mock user role check
        mockSql.mockResolvedValueOnce([{ role: "user" }]);

        await expect(
          db.releaseSpotReservation(
            testParams.requestingUserEmail,
            testParams.spotId,
            testParams.startTime,
            testParams.endTime
          )
        ).rejects.toThrow("You can only release your own reservations");
      });

      it("should allow admin to release any reservation", async () => {
        mockSql.mockResolvedValueOnce([{ role: "admin" }]);
        mockSql.mockResolvedValueOnce([
          {
            user_email: "other@example.com",
            start_time: new Date(),
            end_time: new Date(),
          },
        ]);
        mockSql.mockResolvedValueOnce([]);

        await expect(
          db.releaseSpotReservation(
            testParams.requestingUserEmail,
            testParams.spotId,
            testParams.startTime,
            testParams.endTime
          )
        ).resolves.not.toThrow();
      });
    });

    // Add more test cases for other functions...
  });
});
