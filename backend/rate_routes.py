"""
Rate management routes for admin
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta
from secure_auth import admin_required
from database import db, Rate
import logging

logger = logging.getLogger(__name__)

# Create rates blueprint
rates_bp = Blueprint('rates', __name__, url_prefix='/api/admin/rates')


@rates_bp.route('/', methods=['GET'])
def get_rates():
    """Get all rates (public endpoint for displaying rates)"""
    try:
        # Get query parameters
        rate_type = request.args.get('type')  # 'base' or 'special'
        guests = request.args.get('guests', type=int)
        active_only = request.args.get('active', 'true').lower() == 'true'
        check_date = request.args.get('date')  # Check rates for specific date
        
        # Build query
        query = Rate.query
        
        if rate_type:
            query = query.filter_by(rate_type=rate_type)
        
        if guests:
            query = query.filter_by(guests=guests)
        
        if active_only:
            query = query.filter_by(is_active=True)
        
        # Order by rate_type (base first), then guests, then start_date
        query = query.order_by(
            Rate.rate_type.desc(),
            Rate.guests.asc(),
            Rate.start_date.asc().nullsfirst()
        )
        
        rates = query.all()
        
        # Filter by date if specified (for special rates)
        if check_date:
            try:
                check_date_obj = datetime.fromisoformat(check_date).date()
                filtered_rates = []
                for rate in rates:
                    if rate.rate_type == 'base':
                        filtered_rates.append(rate)
                    elif rate.start_date and rate.end_date:
                        if rate.start_date <= check_date_obj <= rate.end_date:
                            filtered_rates.append(rate)
                rates = filtered_rates
            except ValueError:
                pass
        
        return jsonify({
            'rates': [rate.to_dict() for rate in rates]
        })
    
    except Exception as e:
        logger.error(f"Failed to fetch rates: {e}")
        return jsonify({'error': 'Failed to fetch rates'}), 500


@rates_bp.route('/calculate', methods=['POST'])
def calculate_rate():
    """Calculate rate for a given date range and guest count"""
    try:
        data = request.get_json()
        checkin_date = datetime.fromisoformat(data['checkin_date']).date()
        checkout_date = datetime.fromisoformat(data['checkout_date']).date()
        guests = data['guests']
        
        if guests < 1 or guests > 2:
            return jsonify({'error': 'Guests must be 1 or 2'}), 400
        
        if checkout_date <= checkin_date:
            return jsonify({'error': 'Checkout date must be after checkin date'}), 400
        
        # Calculate total nights
        nights = (checkout_date - checkin_date).days
        
        # Get base rate for this guest count
        base_rate = Rate.query.filter_by(
            rate_type='base',
            guests=guests,
            is_active=True
        ).first()
        
        if not base_rate:
            return jsonify({'error': 'Base rate not found'}), 404
        
        # Check for special rates that apply
        special_rates = Rate.query.filter(
            Rate.rate_type == 'special',
            Rate.guests == guests,
            Rate.is_active == True,
            Rate.start_date <= checkout_date,
            Rate.end_date >= checkin_date
        ).all()
        
        # Calculate total cost per night
        nightly_rates = []
        current_date = checkin_date
        
        while current_date < checkout_date:
            # Check if any special rate applies for this date
            applicable_special = None
            for special in special_rates:
                if special.start_date <= current_date <= special.end_date:
                    applicable_special = special
                    break
            
            if applicable_special:
                nightly_rates.append({
                    'date': current_date.isoformat(),
                    'rate': float(applicable_special.amount),
                    'rate_type': 'special',
                    'description': applicable_special.description
                })
            else:
                nightly_rates.append({
                    'date': current_date.isoformat(),
                    'rate': float(base_rate.amount),
                    'rate_type': 'base',
                    'description': f'Base rate for {guests} guest(s)'
                })
            
            current_date = current_date + timedelta(days=1)
        
        total_amount = sum(night['rate'] for night in nightly_rates)
        
        return jsonify({
            'nights': nights,
            'guests': guests,
            'base_rate': float(base_rate.amount),
            'nightly_rates': nightly_rates,
            'total_amount': total_amount,
            'currency': 'ZAR'
        })
    
    except KeyError as e:
        return jsonify({'error': f'Missing required field: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Failed to calculate rate: {e}")
        return jsonify({'error': 'Failed to calculate rate'}), 500


@rates_bp.route('/<int:rate_id>', methods=['GET'])
@admin_required
def get_rate(rate_id):
    """Get a specific rate by ID"""
    try:
        rate = db.session.get(Rate, rate_id)
        
        if not rate:
            return jsonify({'error': 'Rate not found'}), 404
        
        return jsonify(rate.to_dict())
    
    except Exception as e:
        logger.error(f"Failed to fetch rate: {e}")
        return jsonify({'error': 'Failed to fetch rate'}), 500


@rates_bp.route('/', methods=['POST'])
@admin_required
def create_rate():
    """Create a new rate"""
    try:
        # Get user email from request context (set by admin_required decorator)
        user_email = getattr(request, 'user', {}).get('email')
        
        data = request.get_json()
        
        # Validate required fields
        if 'rate_type' not in data or 'guests' not in data or 'amount' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Validate rate_type
        if data['rate_type'] not in ['base', 'special']:
            return jsonify({'error': 'rate_type must be "base" or "special"'}), 400
        
        # Validate guests
        if data['guests'] not in [1, 2]:
            return jsonify({'error': 'guests must be 1 or 2'}), 400
        
        # Validate amount
        if float(data['amount']) <= 0:
            return jsonify({'error': 'amount must be greater than 0'}), 400
        
        # Validate dates for special rates
        if data['rate_type'] == 'special':
            if 'start_date' not in data or 'end_date' not in data:
                return jsonify({'error': 'Special rates require start_date and end_date'}), 400
            
            start_date = datetime.fromisoformat(data['start_date']).date()
            end_date = datetime.fromisoformat(data['end_date']).date()
            
            if end_date < start_date:
                return jsonify({'error': 'end_date must be after or equal to start_date'}), 400
            
            # Check for overlapping special rates
            overlapping = Rate.query.filter(
                Rate.rate_type == 'special',
                Rate.guests == data['guests'],
                Rate.is_active == True,
                Rate.id != data.get('id', 0),
                Rate.start_date <= end_date,
                Rate.end_date >= start_date
            ).first()
            
            if overlapping:
                return jsonify({'error': 'This date range overlaps with an existing special rate'}), 400
        
        # For base rates, ensure no other active base rate exists for this guest count
        if data['rate_type'] == 'base':
            existing_base = Rate.query.filter_by(
                rate_type='base',
                guests=data['guests'],
                is_active=True
            ).first()
            
            if existing_base:
                # Deactivate the existing base rate
                existing_base.is_active = False
                existing_base.updated_by = user_email
        
        # Create new rate
        new_rate = Rate(
            rate_type=data['rate_type'],
            guests=data['guests'],
            amount=data['amount'],
            start_date=datetime.fromisoformat(data['start_date']).date() if data.get('start_date') else None,
            end_date=datetime.fromisoformat(data['end_date']).date() if data.get('end_date') else None,
            description=data.get('description'),
            is_active=data.get('is_active', True),
            created_by=user_email
        )
        
        db.session.add(new_rate)
        db.session.commit()
        
        logger.info(f"Rate created: {new_rate.id} by {user_email}")
        
        return jsonify({
            'message': 'Rate created successfully',
            'rate': new_rate.to_dict()
        }), 201
    
    except ValueError as e:
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Failed to create rate: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create rate'}), 500


@rates_bp.route('/<int:rate_id>', methods=['PUT'])
@admin_required
def update_rate(rate_id):
    """Update an existing rate"""
    try:
        # Get user email from request context (set by admin_required decorator)
        user_email = getattr(request, 'user', {}).get('email')
        
        rate = db.session.get(Rate, rate_id)
        
        if not rate:
            return jsonify({'error': 'Rate not found'}), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'amount' in data:
            if float(data['amount']) <= 0:
                return jsonify({'error': 'amount must be greater than 0'}), 400
            rate.amount = data['amount']
        
        if 'description' in data:
            rate.description = data['description']
        
        if 'is_active' in data:
            rate.is_active = data['is_active']
        
        # Handle date updates for special rates
        if rate.rate_type == 'special':
            if 'start_date' in data:
                rate.start_date = datetime.fromisoformat(data['start_date']).date()
            
            if 'end_date' in data:
                rate.end_date = datetime.fromisoformat(data['end_date']).date()
            
            # Validate date range
            if rate.end_date < rate.start_date:
                return jsonify({'error': 'end_date must be after or equal to start_date'}), 400
            
            # Check for overlapping special rates
            overlapping = Rate.query.filter(
                Rate.rate_type == 'special',
                Rate.guests == rate.guests,
                Rate.is_active == True,
                Rate.id != rate.id,
                Rate.start_date <= rate.end_date,
                Rate.end_date >= rate.start_date
            ).first()
            
            if overlapping and data.get('is_active', rate.is_active):
                return jsonify({'error': 'This date range overlaps with an existing special rate'}), 400
        
        rate.updated_by = user_email
        db.session.commit()
        
        logger.info(f"Rate updated: {rate.id} by {user_email}")
        
        return jsonify({
            'message': 'Rate updated successfully',
            'rate': rate.to_dict()
        })
    
    except ValueError as e:
        return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
    except Exception as e:
        logger.error(f"Failed to update rate: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update rate'}), 500


@rates_bp.route('/<int:rate_id>', methods=['DELETE'])
@admin_required
def delete_rate(rate_id):
    """Delete a rate (soft delete by setting is_active to False)"""
    try:
        # Get user email from request context (set by admin_required decorator)
        user_email = getattr(request, 'user', {}).get('email')
        
        rate = db.session.get(Rate, rate_id)
        
        if not rate:
            return jsonify({'error': 'Rate not found'}), 404
        
        # Don't allow deleting the last base rate for a guest count
        if rate.rate_type == 'base':
            other_active_base = Rate.query.filter(
                Rate.rate_type == 'base',
                Rate.guests == rate.guests,
                Rate.is_active == True,
                Rate.id != rate.id
            ).first()
            
            if not other_active_base:
                return jsonify({'error': 'Cannot delete the only active base rate for this guest count'}), 400
        
        rate.is_active = False
        rate.updated_by = user_email
        db.session.commit()
        
        logger.info(f"Rate deleted (soft): {rate.id} by {user_email}")
        
        return jsonify({'message': 'Rate deleted successfully'})
    
    except Exception as e:
        logger.error(f"Failed to delete rate: {e}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete rate'}), 500


@rates_bp.route('/base', methods=['GET'])
def get_base_rates():
    """Get current base rates for display on public pages"""
    try:
        base_rates = Rate.query.filter_by(
            rate_type='base',
            is_active=True
        ).order_by(Rate.guests.asc()).all()
        
        if not base_rates:
            return jsonify({'error': 'No base rates found'}), 404
        
        return jsonify({
            'rates': [rate.to_dict() for rate in base_rates]
        })
    
    except Exception as e:
        logger.error(f"Failed to fetch base rates: {e}")
        return jsonify({'error': 'Failed to fetch base rates'}), 500
