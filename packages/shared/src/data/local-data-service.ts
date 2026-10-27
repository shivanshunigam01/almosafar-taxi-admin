import { createDemoId } from "../constants/ids";
import { getDemoSeedBundle } from "../demo/seed";
import { LocalDemoRideRepository } from "../repository/local-demo-ride-repository";
import type { RideRepository } from "../repository/ride-repository";
import type {
  Driver,
  FareConfiguration,
  Passenger,
  PaymentMethod,
  Rating,
  ServiceZone,
  TripHistoryEntry,
  Vehicle,
  VehicleCategory,
} from "../schemas/entities";
import type { Ride } from "../schemas/ride";
import { buildRideRequest } from "../rides/create";
import { estimateTripFare } from "../fare/estimate";
import { LOCAL_SYNC_LABEL } from "./config";
import type { AlmosafarDataService, RideBookingInput } from "./types";

export class LocalDemoDataService implements AlmosafarDataService {
  readonly mode = "local" as const;
  readonly syncLabel = LOCAL_SYNC_LABEL;
  readonly rideRepository: RideRepository;

  private passengers = new Map<string, Passenger>();
  private paymentMethods = new Map<string, PaymentMethod>();
  private tripHistory = new Map<string, TripHistoryEntry>();
  private ratings: Rating[] = [];
  private fareConfigurations: FareConfiguration[] = [];
  private drivers = new Map<string, Driver>();
  private vehicles = new Map<string, Vehicle>();
  private zone!: ServiceZone;

  constructor(rideRepository?: RideRepository) {
    const seed = getDemoSeedBundle();
    this.zone = seed.zone;
    this.fareConfigurations = [...seed.fareConfigurations];
    seed.passengers.forEach((p) => this.passengers.set(p.id, p));
    seed.drivers.forEach((d) => this.drivers.set(d.id, d));
    seed.vehicles.forEach((v) => this.vehicles.set(v.id, v));
    seed.paymentMethods.forEach((pm) => this.paymentMethods.set(pm.id, pm));
    seed.tripHistory.forEach((t) => this.tripHistory.set(t.id, t));
    this.ratings = [...seed.ratings];

    this.rideRepository =
      rideRepository ??
      new LocalDemoRideRepository({
        onRideCompleted: (ride) => this.recordTripHistory(ride),
      });
  }

  private recordTripHistory(ride: Ride): void {
    const entry: TripHistoryEntry = {
      id: createDemoId(`trip_${ride.id}`),
      rideId: ride.id,
      passengerId: ride.passengerId,
      driverId: ride.driverId,
      pickup: ride.pickup,
      dropoff: ride.dropoff,
      completedAt: ride.completedAt,
      fareTotal: ride.fareFinal?.total ?? ride.fareEstimate!.total,
      vehicleCategory: ride.category,
      isDemoData: true,
    };
    this.tripHistory.set(entry.id, entry);
  }

  getDefaultZone(): ServiceZone {
    return this.zone;
  }

  async listFareConfigurations(): Promise<FareConfiguration[]> {
    return [...this.fareConfigurations];
  }

  async getFareConfiguration(
    zoneId: string,
    category: VehicleCategory
  ): Promise<FareConfiguration | null> {
    return (
      this.fareConfigurations.find(
        (c) => c.zoneId === zoneId && c.category === category && c.isActive
      ) ?? null
    );
  }

  async getPaymentMethods(passengerId: string): Promise<PaymentMethod[]> {
    return [...this.paymentMethods.values()].filter(
      (pm) => pm.passengerId === passengerId
    );
  }

  async setDefaultPaymentMethod(
    passengerId: string,
    paymentMethodId: string
  ): Promise<void> {
    for (const [id, pm] of this.paymentMethods.entries()) {
      if (pm.passengerId !== passengerId) continue;
      this.paymentMethods.set(id, { ...pm, isDefault: pm.id === paymentMethodId });
    }
  }

  async registerDemoPassenger(input: {
    displayName: string;
    email: string;
    phoneE164?: string;
  }): Promise<Passenger> {
    const now = new Date().toISOString();
    const passenger: Passenger = {
      id: createDemoId(`passenger_${Date.now()}`),
      displayName: input.displayName,
      email: input.email,
      phoneE164: input.phoneE164,
      createdAt: now,
      updatedAt: now,
      isDemoData: true,
    };
    this.passengers.set(passenger.id, passenger);

    const cash: PaymentMethod = {
      id: createDemoId(`pm_cash_${passenger.id}`),
      passengerId: passenger.id,
      type: "cash",
      label: "Demo — Cash",
      isDefault: true,
      isDemoData: true,
    };
    const card: PaymentMethod = {
      id: createDemoId(`pm_card_${passenger.id}`),
      passengerId: passenger.id,
      type: "card_mock",
      label: "Demo Card · Mock",
      mockLastFour: "4242",
      isDefault: false,
      isDemoData: true,
    };
    this.paymentMethods.set(cash.id, cash);
    this.paymentMethods.set(card.id, card);

    return passenger;
  }

  async loginDemoPassenger(email: string): Promise<Passenger | null> {
    const normalized = email.trim().toLowerCase();
    return (
      [...this.passengers.values()].find(
        (p) => p.email?.toLowerCase() === normalized
      ) ?? null
    );
  }

  async getPassenger(id: string): Promise<Passenger | null> {
    return this.passengers.get(id) ?? null;
  }

  async createRideFromBooking(input: RideBookingInput): Promise<Ride> {
    const fareConfig = await this.getFareConfiguration(input.zoneId, input.category);
    if (!fareConfig) throw new Error("Fare configuration not found.");
    const fareEstimate = estimateTripFare({
      pickup: input.pickup,
      dropoff: input.dropoff,
      fareConfig,
    });
    const ride = buildRideRequest({
      passengerId: input.passengerId,
      zoneId: input.zoneId,
      category: input.category,
      pickup: input.pickup,
      dropoff: input.dropoff,
      fareEstimate,
      paymentMethodId: input.paymentMethodId,
      isDemoData: true,
    });
    return this.rideRepository.createRideRequest(ride);
  }

  createRideRequest(ride: Ride): Promise<Ride> {
    return this.rideRepository.createRideRequest(ride);
  }

  getRide(rideId: string): Promise<Ride | null> {
    return this.rideRepository.getRide(rideId);
  }

  subscribeRide(
    rideId: string,
    listener: (ride: Ride | null) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.rideRepository.subscribeRide(rideId, listener, onError);
  }

  cancelRideAsPassenger(
    rideId: string,
    passengerId: string,
    reason: string
  ): Promise<Ride> {
    return this.rideRepository.cancelRideAsPassenger(rideId, passengerId, reason);
  }

  listRidesForPassenger(passengerId: string): Promise<Ride[]> {
    return this.rideRepository.listRidesForPassenger(passengerId);
  }

  async listTripHistory(passengerId: string): Promise<TripHistoryEntry[]> {
    return [...this.tripHistory.values()]
      .filter((t) => t.passengerId === passengerId)
      .sort((a, b) =>
        (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
      );
  }

  async submitRating(rating: Rating): Promise<void> {
    this.ratings.push(rating);
  }

  async getDriver(id: string): Promise<Driver | null> {
    return this.drivers.get(id) ?? null;
  }

  async loginDemoDriver(email: string): Promise<Driver | null> {
    const normalized = email.trim().toLowerCase();
    return (
      [...this.drivers.values()].find(
        (d) => d.email?.toLowerCase() === normalized
      ) ?? [...this.drivers.values()][0] ??
      null
    );
  }

  async setDriverOnline(driverId: string, isOnline: boolean): Promise<void> {
    const d = this.drivers.get(driverId);
    if (d) this.drivers.set(driverId, { ...d, isOnline });
    await this.rideRepository.setDriverOnline(driverId, isOnline);
  }

  async isDriverOnline(driverId: string): Promise<boolean> {
    return this.rideRepository.isDriverOnline(driverId);
  }

  subscribeOpenRideRequests(
    listener: (rides: Ride[]) => void,
    onError?: (error: Error) => void
  ): () => void {
    return this.rideRepository.subscribeOpenRideRequests(listener, onError);
  }

  acceptRideAsDriver(params: {
    rideId: string;
    driverId: string;
    vehicleId: string;
  }): Promise<Ride> {
    return this.rideRepository.acceptRideAsDriver(params);
  }

  rejectRideAsDriver(params: {
    rideId: string;
    driverId: string;
    note?: string;
  }): Promise<Ride> {
    return this.rideRepository.rejectRideAsDriver(params);
  }

  transitionRideAsDriver(params: {
    rideId: string;
    driverId: string;
    toStatus: Ride["status"];
    note?: string;
  }): Promise<Ride> {
    return this.rideRepository.transitionRideAsDriver(params);
  }

  listRidesForDriver(driverId: string): Promise<Ride[]> {
    return this.rideRepository.listRidesForDriver(driverId);
  }

  async getVehicle(id: string): Promise<Vehicle | null> {
    return this.vehicles.get(id) ?? null;
  }

  startLocalDriverSimulation(rideId: string): void {
    this.rideRepository.startLocalDriverSimulation?.(rideId);
  }

  stopLocalDriverSimulation(rideId: string): void {
    this.rideRepository.stopLocalDriverSimulation?.(rideId);
  }
}
